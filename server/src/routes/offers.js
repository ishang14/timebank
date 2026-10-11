import { Router } from 'express';
import { z } from 'zod';
import { BROWSE_PREFIX, cacheResponse, clearBrowse } from '../lib/cache.js';
import { CATEGORIES } from '../lib/categories.js';
import { httpError } from '../lib/httpError.js';
import { parseId } from '../lib/parseId.js';
import prisma from '../lib/prisma.js';
import { findReviews, offerRatings } from '../lib/ratings.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const offerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(CATEGORIES, { message: 'Invalid category' }),
  price: z.number().int('Price must be a whole number').min(1, 'Price must be at least 1'),
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must look like HH:MM');
const slotSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must look like YYYY-MM-DD'),
    startTime: time,
    endTime: time,
  })
  .refine((s) => s.endTime > s.startTime, { message: 'End time must be after start time' });

const providerSelect = { select: { id: true, name: true } };
const freeSlots = { where: { status: 'FREE' }, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] };

// Loads an offer and checks that the logged-in user owns it
async function getOwnedOffer(req) {
  const offer = await prisma.offer.findUnique({ where: { id: parseId(req.params.id, 'Offer') } });
  if (!offer) throw httpError(404, 'Offer not found');
  if (offer.userId !== req.userId) throw httpError(403, 'This is not your offer');
  return offer;
}

// Browse: public, with optional filters. Cached per query string.
const browseKey = (req) => BROWSE_PREFIX + (req.originalUrl.split('?')[1] || '');
router.get('/', cacheResponse(browseKey), async (req, res) => {
  const { search, category, maxPrice, minRating } = req.query;
  const where = {};
  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }
  if (category) where.category = String(category);
  if (maxPrice && !isNaN(Number(maxPrice))) where.price = { lte: Number(maxPrice) };

  const offers = await prisma.offer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: providerSelect, slots: freeSlots },
  });
  const ratings = await offerRatings();
  const withRatings = offers.map((o) => ({ ...o, averageRating: ratings.get(o.id) ?? null }));
  // Offers without any rating are hidden when a minimum rating is set
  const min = Number(minRating);
  res.json(minRating && min > 0 ? withRatings.filter((o) => o.averageRating >= min) : withRatings);
});

// My offers, with all their slots
router.get('/mine', requireAuth, async (req, res) => {
  const offers = await prisma.offer.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: { slots: { orderBy: [{ date: 'asc' }, { startTime: 'asc' }] } },
  });
  res.json(offers);
});

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id, 'Offer');
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { user: providerSelect, slots: freeSlots },
  });
  if (!offer) throw httpError(404, 'Offer not found');
  const ratings = await offerRatings();
  const reviews = await findReviews({ offerId: id });
  res.json({ ...offer, averageRating: ratings.get(id) ?? null, reviews });
});

router.post('/', requireAuth, validate(offerSchema), async (req, res) => {
  const offer = await prisma.offer.create({ data: { ...req.body, userId: req.userId } });
  await clearBrowse();
  res.status(201).json(offer);
});

router.put('/:id', requireAuth, validate(offerSchema), async (req, res) => {
  const offer = await getOwnedOffer(req);
  const updated = await prisma.offer.update({ where: { id: offer.id }, data: req.body });
  await clearBrowse();
  res.json(updated);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const offer = await getOwnedOffer(req);
  // Bookings point at the offer, so it cannot be deleted once someone booked it
  if (await prisma.booking.count({ where: { offerId: offer.id } })) {
    throw httpError(409, 'This offer has bookings and cannot be deleted');
  }
  await prisma.offer.delete({ where: { id: offer.id } }); // slots are deleted with it
  await clearBrowse();
  res.status(204).end();
});

router.post('/:id/slots', requireAuth, validate(slotSchema), async (req, res) => {
  const offer = await getOwnedOffer(req);
  const { date, startTime, endTime } = req.body;
  const slot = await prisma.slot.create({
    data: { offerId: offer.id, date: new Date(date), startTime, endTime },
  });
  await clearBrowse();
  res.status(201).json(slot);
});

router.delete('/:id/slots/:slotId', requireAuth, async (req, res) => {
  const offer = await getOwnedOffer(req);
  const slotId = parseId(req.params.slotId, 'Slot');
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot || slot.offerId !== offer.id) throw httpError(404, 'Slot not found');
  if (slot.status === 'BOOKED' || (await prisma.booking.count({ where: { slotId } }))) {
    throw httpError(409, 'This slot has been booked and cannot be removed');
  }
  await prisma.slot.delete({ where: { id: slotId } });
  await clearBrowse();
  res.status(204).end();
});

export default router;
