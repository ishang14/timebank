import request from 'supertest';
import app from '../src/app.js';
import redis from '../src/lib/redis.js';
import { createOffer, createUser, resetDb } from './helpers.js';

beforeEach(async () => {
  await resetDb();
  await redis.flushdb(); // tests use their own Redis database (see .env.test)
});

describe('caching', () => {
  test('first request is a miss, second is a hit', async () => {
    const first = await request(app).get('/api/stats');
    const second = await request(app).get('/api/stats');
    expect(first.headers['x-cache']).toBe('MISS');
    expect(second.headers['x-cache']).toBe('HIT');
    expect(second.body).toEqual(first.body);
  });

  test('browse is cached separately per query string', async () => {
    await request(app).get('/api/offers?category=Coding');
    const same = await request(app).get('/api/offers?category=Coding');
    const other = await request(app).get('/api/offers?category=Music');
    expect(same.headers['x-cache']).toBe('HIT');
    expect(other.headers['x-cache']).toBe('MISS');
  });

  test('creating an offer clears the browse cache', async () => {
    const { auth } = await createUser();
    await request(app).get('/api/offers'); // fills the cache
    expect((await request(app).get('/api/offers')).headers['x-cache']).toBe('HIT');

    const created = await request(app)
      .post('/api/offers')
      .set(auth)
      .send({ title: 'New', description: 'd', category: 'Coding', price: 1 });
    expect(created.status).toBe(201);

    const after = await request(app).get('/api/offers');
    expect(after.headers['x-cache']).toBe('MISS');
    expect(after.body.map((o) => o.title)).toContain('New');
  });

  test('completing a booking clears the stats cache', async () => {
    const provider = await createUser();
    const requester = await createUser();
    const { slotIds } = await createOffer(provider.user.id, { price: 1 });
    const booking = await request(app).post('/api/bookings').set(requester.auth).send({ slotId: slotIds[0] });
    await request(app).patch(`/api/bookings/${booking.body.id}/status`).set(provider.auth).send({ status: 'ACCEPTED' });

    await request(app).get('/api/stats');
    expect((await request(app).get('/api/stats')).headers['x-cache']).toBe('HIT');

    await request(app).patch(`/api/bookings/${booking.body.id}/status`).set(requester.auth).send({ status: 'COMPLETED' });
    const after = await request(app).get('/api/stats');
    expect(after.headers['x-cache']).toBe('MISS');
    expect(after.body.sessions).toBe(1);
  });
});

describe('rate limiting', () => {
  test('the 6th login attempt in a minute gets a 429', async () => {
    const attempt = () => request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'wrong' });
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);

    const sixth = await attempt();
    expect(sixth.status).toBe(429);
    expect(Number(sixth.headers['retry-after'])).toBeGreaterThan(0);
  });
});
