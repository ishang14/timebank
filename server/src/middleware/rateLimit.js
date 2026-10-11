import redis from '../lib/redis.js';

// Fixed-window rate limiter: at most `limit` requests per `windowSeconds`,
// counted per key (an IP, a user id...) with Redis INCR + EXPIRE.
export const rateLimit = ({ name, limit, windowSeconds, keyFor }) => async (req, res, next) => {
  try {
    const key = `ratelimit:${name}:${keyFor(req)}`;
    const count = await redis.incr(key);
    // First request in the window starts the clock
    if (count === 1) await redis.expire(key, windowSeconds);
    if (count > limit) {
      const ttl = await redis.ttl(key);
      res.set('Retry-After', String(ttl > 0 ? ttl : windowSeconds));
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
  } catch {
    // Redis is down: let the request through
  }
  next();
};

export const loginLimiter = rateLimit({
  name: 'login',
  limit: 5,
  windowSeconds: 60,
  keyFor: (req) => req.ip,
});

export const bookingLimiter = rateLimit({
  name: 'booking',
  limit: 20,
  windowSeconds: 60,
  keyFor: (req) => req.userId,
});
