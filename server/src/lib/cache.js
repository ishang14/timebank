import redis from './redis.js';

const TTL_SECONDS = 60;

// Every helper swallows Redis errors, so a Redis outage never breaks a request

async function cacheGet(key) {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

async function cacheSet(key, value) {
  try {
    await redis.set(key, value, 'EX', TTL_SECONDS);
  } catch {
    // ignore: the response is still sent, just not cached
  }
}

// Deletes every key starting with prefix. Uses SCAN (never KEYS, which blocks Redis).
export async function cacheDeleteByPrefix(prefix) {
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
      if (keys.length) await redis.del(...keys);
      cursor = next;
    } while (cursor !== '0');
  } catch {
    // ignore: stale entries expire after TTL_SECONDS anyway
  }
}

// Cache keys, in one place so reads and invalidation agree
export const STATS_KEY = 'cache:stats';
export const BROWSE_PREFIX = 'cache:browse:';
export const clearStats = () => cacheDeleteByPrefix(STATS_KEY);
export const clearBrowse = () => cacheDeleteByPrefix(BROWSE_PREFIX);

// Express middleware: answer GET requests from the cache when possible.
// The X-Cache header says HIT or MISS. Only 200 responses are cached.
export const cacheResponse = (keyFor) => async (req, res, next) => {
  const key = keyFor(req);
  const cached = await cacheGet(key);
  if (cached) {
    res.set('X-Cache', 'HIT');
    return res.type('json').send(cached);
  }
  res.set('X-Cache', 'MISS');
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode !== 200) return sendJson(body);
    // Save before replying, so the next request is sure to see it
    cacheSet(key, JSON.stringify(body)).then(() => sendJson(body));
    return res;
  };
  next();
};
