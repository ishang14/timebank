import { Router } from 'express';
import { httpError } from '../lib/httpError.js';
import { parseId } from '../lib/parseId.js';
import prisma from '../lib/prisma.js';
import { findReviews, providerRating } from '../lib/ratings.js';

const router = Router();

// Public profile: no email or password hash
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id, 'User');
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, createdAt: true, offers: true },
  });
  if (!user) throw httpError(404, 'User not found');
  const averageRating = await providerRating(id);
  const reviews = await findReviews({ providerId: id });
  res.json({ ...user, averageRating, reviews });
});

export default router;
