import { Router } from 'express';
import { cacheResponse, STATS_KEY } from '../lib/cache.js';
import prisma from '../lib/prisma.js';

const router = Router();

// Community stats from completed bookings. A booking's length is its slot's end - start time.
router.get('/', cacheResponse(() => STATS_KEY), async (req, res) => {
  const [total] = await prisma.$queryRaw`
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time::time - s.start_time::time)) / 3600), 0)::float AS hours,
           COUNT(*)::int AS sessions
    FROM bookings b
    JOIN slots s ON s.id = b.slot_id
    WHERE b.status = 'COMPLETED'`;

  const topSkills = await prisma.$queryRaw`
    SELECT o.title AS skill, o.category, COUNT(*)::int AS sessions
    FROM bookings b
    JOIN offers o ON o.id = b.offer_id
    WHERE b.status = 'COMPLETED'
    GROUP BY o.title, o.category
    ORDER BY sessions DESC, o.title
    LIMIT 5`;

  const topHelpers = await prisma.$queryRaw`
    SELECT u.id, u.name, COUNT(*)::int AS sessions
    FROM bookings b
    JOIN users u ON u.id = b.provider_id
    WHERE b.status = 'COMPLETED'
    GROUP BY u.id, u.name
    ORDER BY sessions DESC, u.name
    LIMIT 5`;

  res.json({ hoursExchanged: total.hours, sessions: total.sessions, topSkills, topHelpers });
});

export default router;
