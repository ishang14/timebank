import Redis from 'ioredis';

// Without an offline queue, commands fail immediately while Redis is down
// instead of waiting. Callers catch the error and carry on without Redis.
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
});

// Log the first error of an outage only, not every retry
let down = false;
redis.on('error', (err) => {
  if (!down) console.warn('Redis unavailable, continuing without it:', err.message);
  down = true;
});
redis.on('ready', () => {
  down = false;
});

export default redis;
