// Loads demo data. Run with: npm run seed
// It wipes all existing data first. Every demo user's password is "password123".
import bcrypt from 'bcrypt';
import { cacheDeleteByPrefix } from '../src/lib/cache.js';
import prisma from '../src/lib/prisma.js';
import redis from '../src/lib/redis.js';

// A date n days from today (negative = past)
const day = (n) => new Date(Date.now() + n * 24 * 3600 * 1000);

const passwordHash = await bcrypt.hash('password123', 10);
const makeUser = (name) =>
  prisma.user.create({ data: { name, email: `${name.toLowerCase()}@demo.com`, passwordHash } });

const makeOffer = (user, title, category, price, description) =>
  prisma.offer.create({ data: { userId: user.id, title, category, price, description } });

const makeSlot = (offer, offsetDays, startTime, endTime, status = 'FREE') =>
  prisma.slot.create({ data: { offerId: offer.id, date: day(offsetDays), startTime, endTime, status } });

// Creates a booking in the given status. COMPLETED ones also move credits and
// add a transaction row in one database transaction, like the real app does.
async function makeBooking(offer, slot, requester, status, review) {
  const booking = await prisma.booking.create({
    data: {
      offerId: offer.id,
      slotId: slot.id,
      requesterId: requester.id,
      providerId: offer.userId,
      cost: offer.price,
      status,
    },
  });
  if (status === 'COMPLETED') {
    await prisma.$transaction([
      prisma.user.update({ where: { id: requester.id }, data: { balance: { decrement: offer.price } } }),
      prisma.user.update({ where: { id: offer.userId }, data: { balance: { increment: offer.price } } }),
      prisma.transaction.create({
        data: { fromUserId: requester.id, toUserId: offer.userId, amount: offer.price, bookingId: booking.id },
      }),
    ]);
  }
  if (review) {
    await prisma.review.create({
      data: { bookingId: booking.id, reviewerId: requester.id, rating: review[0], comment: review[1] },
    });
  }
}

// Start from an empty database (children first)
await prisma.review.deleteMany();
await prisma.transaction.deleteMany();
await prisma.booking.deleteMany();
await prisma.slot.deleteMany();
await prisma.offer.deleteMany();
await prisma.user.deleteMany();

const alice = await makeUser('Alice');
const bob = await makeUser('Bob');
const carol = await makeUser('Carol');
const dave = await makeUser('Dave');
const eve = await makeUser('Eve');

const python = await makeOffer(alice, 'Python for beginners', 'Coding', 2, 'Variables, loops and functions, with exercises.');
const react = await makeOffer(alice, 'React help', 'Coding', 1, 'Components, hooks and debugging your project.');
const spanish = await makeOffer(bob, 'Spanish conversation', 'Languages', 1, 'Practice speaking in a relaxed setting.');
const guitar = await makeOffer(carol, 'Guitar basics', 'Music', 2, 'Chords and simple songs.');
const calculus = await makeOffer(dave, 'Calculus tutoring', 'Tutoring', 2, 'Limits, derivatives and integrals.');
const poster = await makeOffer(eve, 'Poster design in Figma', 'Design', 1, 'Layout, colour and type for event posters.');

// Past sessions (completed, with reviews) so stats and ratings have data
await makeBooking(python, await makeSlot(python, -10, '10:00', '11:00', 'BOOKED'), bob, 'COMPLETED', [5, 'Very clear explanations.']);
await makeBooking(python, await makeSlot(python, -8, '14:00', '15:30', 'BOOKED'), carol, 'COMPLETED', [4, 'Great pace, would book again.']);
await makeBooking(spanish, await makeSlot(spanish, -6, '18:00', '19:00', 'BOOKED'), alice, 'COMPLETED', [5, 'Fun and patient.']);
await makeBooking(calculus, await makeSlot(calculus, -5, '09:00', '10:00', 'BOOKED'), eve, 'COMPLETED', [4, 'Helped me before my exam.']);
await makeBooking(react, await makeSlot(react, -3, '16:00', '17:00', 'BOOKED'), dave, 'COMPLETED');

// Open and closed bookings
await makeBooking(guitar, await makeSlot(guitar, 2, '17:00', '18:00', 'BOOKED'), alice, 'REQUESTED');
await makeBooking(poster, await makeSlot(poster, 3, '12:00', '13:00', 'BOOKED'), bob, 'ACCEPTED');
await makeBooking(spanish, await makeSlot(spanish, 4, '18:00', '19:00'), dave, 'DECLINED');
await makeBooking(calculus, await makeSlot(calculus, 5, '09:00', '10:00'), carol, 'CANCELLED');

// Free slots to book
for (const [offer, offset, start, end] of [
  [python, 6, '10:00', '11:00'],
  [python, 7, '10:00', '11:00'],
  [react, 6, '15:00', '16:00'],
  [spanish, 7, '18:00', '19:00'],
  [guitar, 8, '17:00', '18:00'],
  [calculus, 9, '09:00', '10:00'],
  [poster, 10, '12:00', '13:00'],
]) {
  await makeSlot(offer, offset, start, end);
}

// Cached responses would still show the old data
await cacheDeleteByPrefix('cache:');

console.log('Seeded 5 users (alice@demo.com ... eve@demo.com, password "password123").');
await prisma.$disconnect();
await redis.quit();
