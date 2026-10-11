import request from 'supertest';
import app from '../src/app.js';
import { createOffer, createUser, resetDb } from './helpers.js';

beforeEach(resetDb);

const signup = (email) =>
  request(app).post('/api/auth/signup').send({ name: 'Ann', email, password: 'secret1' });

describe('error handling', () => {
  test('a duplicate email is a 409, whatever its letter case', async () => {
    expect((await signup('ann@test.com')).status).toBe(201);
    const again = await signup('ANN@Test.com');
    expect(again.status).toBe(409);
    expect(again.body.error).toBe('Email already in use');
  });

  test('a second review for the same booking is a 409', async () => {
    const provider = await createUser();
    const requester = await createUser();
    const { slotIds } = await createOffer(provider.user.id);
    const booking = await request(app).post('/api/bookings').set(requester.auth).send({ slotId: slotIds[0] });
    const id = booking.body.id;
    await request(app).patch(`/api/bookings/${id}/status`).set(provider.auth).send({ status: 'ACCEPTED' });
    await request(app).patch(`/api/bookings/${id}/status`).set(requester.auth).send({ status: 'COMPLETED' });

    const review = (comment) =>
      request(app).post('/api/reviews').set(requester.auth).send({ bookingId: id, rating: 5, comment });
    expect((await review('Great')).status).toBe(201);
    expect((await review('Again')).status).toBe(409);
  });

  test('bad ids and unknown paths return JSON 404s', async () => {
    const { auth } = await createUser();
    expect((await request(app).get('/api/offers/abc')).status).toBe(404);
    expect((await request(app).get('/api/users/99999999999')).status).toBe(404);
    expect((await request(app).patch('/api/bookings/abc/status').set(auth).send({ status: 'CANCELLED' })).status).toBe(404);
    const unknown = await request(app).get('/api/nope');
    expect(unknown.status).toBe(404);
    expect(unknown.body.error).toBe('Not found');
  });
});
