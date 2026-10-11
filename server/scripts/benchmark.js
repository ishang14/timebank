// Measures GET /api/stats with and without the Redis cache.
// Run with: npm run benchmark   (needs Postgres and Redis running)
// It adds temporary demo data to make the stats query do real work, then removes it.
import app from '../src/app.js';
import { cacheDeleteByPrefix, STATS_KEY } from '../src/lib/cache.js';
import prisma from '../src/lib/prisma.js';
import redis from '../src/lib/redis.js';

const BOOKINGS = 50000;
const REQUESTS = 200;

async function addData() {
  await prisma.$executeRaw`
    INSERT INTO users (name, email, password_hash)
    SELECT 'Bench ' || n, 'bench' || n || '@bench.local', 'x' FROM generate_series(1, 100) n`;
  await prisma.$executeRaw`
    INSERT INTO offers (user_id, title, description, category, price)
    SELECT u.id, 'Skill ' || (u.id % 20), 'bench', 'Other', 1 FROM users u WHERE u.email LIKE '%@bench.local'`;
  await prisma.$executeRaw`
    INSERT INTO slots (offer_id, date, start_time, end_time, status)
    SELECT o.id, CURRENT_DATE, '10:00', '11:00', 'BOOKED' FROM offers o WHERE o.description = 'bench'`;
  // Many completed bookings share each slot; the database does not forbid that
  await prisma.$executeRaw`
    INSERT INTO bookings (offer_id, slot_id, requester_id, provider_id, cost, status)
    SELECT o.id, s.id, o.user_id, o.user_id, 1, 'COMPLETED'
    FROM offers o JOIN slots s ON s.offer_id = o.id, generate_series(1, ${BOOKINGS / 100}) g
    WHERE o.description = 'bench'`;
}

async function removeData() {
  await prisma.$executeRaw`DELETE FROM bookings WHERE offer_id IN (SELECT id FROM offers WHERE description = 'bench')`;
  await prisma.$executeRaw`DELETE FROM slots WHERE offer_id IN (SELECT id FROM offers WHERE description = 'bench')`;
  await prisma.$executeRaw`DELETE FROM offers WHERE description = 'bench'`;
  await prisma.$executeRaw`DELETE FROM users WHERE email LIKE '%@bench.local'`;
}

// Time n requests; before() runs before each one, outside the timing
async function measure(url, n, before) {
  const times = [];
  for (let i = 0; i < n; i++) {
    if (before) await before();
    const start = performance.now();
    await (await fetch(url)).text();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / n;
  return { avg: avg.toFixed(2), p95: times[Math.floor(n * 0.95)].toFixed(2) };
}

const server = app.listen(0);
const url = `http://localhost:${server.address().port}/api/stats`;
try {
  await new Promise((resolve) => (redis.status === 'ready' ? resolve() : redis.once('ready', resolve)));
  await removeData(); // in case an earlier run was interrupted
  await addData();
  console.log(`Stats over ${BOOKINGS} completed bookings, ${REQUESTS} requests each:`);

  await measure(url, 5); // warm up
  const without = await measure(url, REQUESTS, () => cacheDeleteByPrefix(STATS_KEY));
  const withCache = await measure(url, REQUESTS);
  console.log(`  without cache: avg ${without.avg} ms, p95 ${without.p95} ms`);
  console.log(`  with cache:    avg ${withCache.avg} ms, p95 ${withCache.p95} ms`);
  console.log(`  speedup: ${(without.avg / withCache.avg).toFixed(1)}x`);
} finally {
  await removeData();
  await cacheDeleteByPrefix(STATS_KEY);
  server.close();
  await redis.quit();
  await prisma.$disconnect();
}
