import prisma from './prisma.js';

// Average rating per offer, as a Map of offerId -> average (offers with no reviews are missing)
export async function offerRatings() {
  const rows = await prisma.$queryRaw`
    SELECT b.offer_id AS "offerId", AVG(r.rating)::float AS avg
    FROM reviews r
    JOIN bookings b ON b.id = r.booking_id
    GROUP BY b.offer_id`;
  return new Map(rows.map((row) => [row.offerId, round(row.avg)]));
}

// Average rating of everything a provider has been reviewed for (null if no reviews)
export async function providerRating(userId) {
  const rows = await prisma.$queryRaw`
    SELECT AVG(r.rating)::float AS avg
    FROM reviews r
    JOIN bookings b ON b.id = r.booking_id
    WHERE b.provider_id = ${userId}`;
  return rows[0].avg === null ? null : round(rows[0].avg);
}

const round = (n) => Math.round(n * 10) / 10;

// Reviews for either an offer or a provider, newest first
export function findReviews(bookingWhere) {
  return prisma.review.findMany({
    where: { booking: bookingWhere },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      reviewer: { select: { id: true, name: true } },
      booking: { select: { offer: { select: { id: true, title: true } } } },
    },
  });
}
