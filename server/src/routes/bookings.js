import { Router } from 'express';
import { z } from 'zod';
import { clearBrowse, clearStats } from '../lib/cache.js';
import { parseId } from '../lib/parseId.js';
import { requireAuth } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { changeStatus, listBookings, requestBooking } from '../services/bookingService.js';

const router = Router();
router.use(requireAuth);

const requestSchema = z.object({ slotId: z.number().int('slotId must be a number') });
const statusSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'], { message: 'Invalid status' }),
});

router.get('/', async (req, res) => {
  const role = req.query.role === 'received' ? 'received' : 'requested';
  res.json(await listBookings(req.userId, role));
});

router.post('/', bookingLimiter, validate(requestSchema), async (req, res) => {
  const booking = await requestBooking(req.userId, req.body.slotId);
  await clearBrowse(); // the slot is no longer free
  res.status(201).json(booking);
});

router.patch('/:id/status', validate(statusSchema), async (req, res) => {
  const booking = await changeStatus(req.userId, parseId(req.params.id, 'Booking'), req.body.status);
  await clearBrowse(); // slots may be free again
  if (booking.status === 'COMPLETED') await clearStats();
  res.json(booking);
});

export default router;
