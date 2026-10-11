import { Router } from 'express';
import { z } from 'zod';
import { httpError } from '../lib/httpError.js';
import { clearBrowse, clearStats } from '../lib/cache.js';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const reviewSchema = z.object({
  bookingId: z.number().int('bookingId must be a number'),
  rating: z.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  comment: z.string().min(1, 'Comment is required').max(500, 'Comment is too long (max 500)'),
});

// The requester reviews a completed booking (one review per booking)
router.post('/', requireAuth, validate(reviewSchema), async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw httpError(404, 'Booking not found');
  if (booking.requesterId !== req.userId) throw httpError(403, 'Only the requester can review');
  if (booking.status !== 'COMPLETED') throw httpError(400, 'You can only review a completed booking');
  // A second review for the same booking is rejected by the database (409 in the error handler)
  const review = await prisma.review.create({
    data: { bookingId, reviewerId: req.userId, rating, comment },
  });
  await Promise.all([clearBrowse(), clearStats()]); // ratings changed
  res.status(201).json(review);
});

export default router;
