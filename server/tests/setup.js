import prisma from '../src/lib/prisma.js';
import redis from '../src/lib/redis.js';

// Wait for Redis before tests start, and close connections when a test file ends
beforeAll(async () => {
  if (redis.status !== 'ready') await new Promise((resolve) => redis.once('ready', resolve));
});
afterAll(async () => {
  await redis.quit();
  await prisma.$disconnect();
});
