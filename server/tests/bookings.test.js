import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { checkTransition } from '../src/services/bookingRules.js';
import { createOffer, createUser, resetDb } from './helpers.js';

beforeEach(resetDb);

const book = (who, slotId) => request(app).post('/api/bookings').set(who.auth).send({ slotId });
const setStatus = (who, id, status) =>
  request(app).patch(`/api/bookings/${id}/status`).set(who.auth).send({ status });

describe('booking status rules', () => {
  const booking = (status) => ({ status, requesterId: 1, providerId: 2 });

  test('allows the documented changes', () => {
    expect(() => checkTransition(booking('REQUESTED'), 'ACCEPTED', 2)).not.toThrow();
    expect(() => checkTransition(booking('REQUESTED'), 'DECLINED', 2)).not.toThrow();
    expect(() => checkTransition(booking('REQUESTED'), 'CANCELLED', 1)).not.toThrow();
    expect(() => checkTransition(booking('ACCEPTED'), 'CANCELLED', 2)).not.toThrow();
    expect(() => checkTransition(booking('ACCEPTED'), 'COMPLETED', 1)).not.toThrow();
  });

  test('rejects everything else', () => {
    expect(() => checkTransition(booking('REQUESTED'), 'COMPLETED', 1)).toThrow(/Cannot change/);
    expect(() => checkTransition(booking('DECLINED'), 'ACCEPTED', 2)).toThrow(/Cannot change/);
    expect(() => checkTransition(booking('COMPLETED'), 'CANCELLED', 1)).toThrow(/Cannot change/);
  });

  test('rejects the wrong person', () => {
    expect(() => checkTransition(booking('REQUESTED'), 'ACCEPTED', 1)).toThrow(/provider/);
    expect(() => checkTransition(booking('ACCEPTED'), 'COMPLETED', 2)).toThrow(/requester/);
    expect(() => checkTransition(booking('REQUESTED'), 'CANCELLED', 99)).toThrow(/requester or provider/);
  });
});

describe('balance check', () => {
  test('pending bookings count against the balance', async () => {
    const provider = await createUser();
    const requester = await createUser(3);
    const { slotIds } = await createOffer(provider.user.id, { price: 2, slots: 2 });

    expect((await book(requester, slotIds[0])).status).toBe(201); // 3 - 2 = 1 left
    const second = await book(requester, slotIds[1]); // needs 2, only 1 available
    expect(second.status).toBe(400);
    expect(second.body.error).toMatch(/Not enough credits/);
  });

  test('cancelling frees the credits and the slot', async () => {
    const provider = await createUser();
    const requester = await createUser(2);
    const { slotIds } = await createOffer(provider.user.id, { price: 2 });

    const created = await book(requester, slotIds[0]);
    expect((await setStatus(requester, created.body.id, 'CANCELLED')).status).toBe(200);
    expect((await prisma.slot.findUnique({ where: { id: slotIds[0] } })).status).toBe('FREE');
    expect((await book(requester, slotIds[0])).status).toBe(201);
  });
});

describe('credit transfer', () => {
  test('completing moves credits and records one transaction', async () => {
    const provider = await createUser(3);
    const requester = await createUser(3);
    const { slotIds } = await createOffer(provider.user.id, { price: 2 });

    const created = await book(requester, slotIds[0]);
    const id = created.body.id;
    expect((await setStatus(provider, id, 'ACCEPTED')).status).toBe(200);

    // Nothing moves before completion
    expect((await prisma.user.findUnique({ where: { id: requester.user.id } })).balance).toBe(3);

    expect((await setStatus(requester, id, 'COMPLETED')).status).toBe(200);
    expect((await prisma.user.findUnique({ where: { id: requester.user.id } })).balance).toBe(1);
    expect((await prisma.user.findUnique({ where: { id: provider.user.id } })).balance).toBe(5);

    const rows = await prisma.transaction.findMany({ where: { bookingId: id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ fromUserId: requester.user.id, toUserId: provider.user.id, amount: 2 });

    // Completing twice must not pay twice
    expect((await setStatus(requester, id, 'COMPLETED')).status).toBe(400);
    expect((await prisma.user.findUnique({ where: { id: provider.user.id } })).balance).toBe(5);
  });

  test('rolls back everything if the requester cannot pay', async () => {
    const provider = await createUser(0);
    const requester = await createUser(2);
    const { slotIds } = await createOffer(provider.user.id, { price: 2 });
    const id = (await book(requester, slotIds[0])).body.id;
    await setStatus(provider, id, 'ACCEPTED');
    // Simulate the requester losing credits some other way
    await prisma.user.update({ where: { id: requester.user.id }, data: { balance: 1 } });

    const res = await setStatus(requester, id, 'COMPLETED');
    expect(res.status).toBe(409);
    expect((await prisma.booking.findUnique({ where: { id } })).status).toBe('ACCEPTED');
    expect(await prisma.transaction.count()).toBe(0);
    expect((await prisma.user.findUnique({ where: { id: provider.user.id } })).balance).toBe(0);
  });

  test('wallet shows balance and transactions', async () => {
    const provider = await createUser();
    const requester = await createUser();
    const { slotIds } = await createOffer(provider.user.id, { price: 1 });
    const id = (await book(requester, slotIds[0])).body.id;
    await setStatus(provider, id, 'ACCEPTED');
    await setStatus(requester, id, 'COMPLETED');

    const wallet = await request(app).get('/api/wallet').set(provider.auth);
    expect(wallet.body.balance).toBe(4);
    expect(wallet.body.transactions).toHaveLength(1);
  });
});

describe('slot double booking', () => {
  test('a taken slot cannot be booked again', async () => {
    const provider = await createUser();
    const a = await createUser();
    const b = await createUser();
    const { slotIds } = await createOffer(provider.user.id);

    expect((await book(a, slotIds[0])).status).toBe(201);
    const second = await book(b, slotIds[0]);
    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/already taken/);
  });

  test('two requests at the same time: exactly one wins', async () => {
    const provider = await createUser();
    const a = await createUser();
    const b = await createUser();
    const { slotIds } = await createOffer(provider.user.id);

    const results = await Promise.all([book(a, slotIds[0]), book(b, slotIds[0])]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.booking.count()).toBe(1);
  });
});
