import jwt from 'jsonwebtoken';
import prisma from '../src/lib/prisma.js';

// Empty every table (children first) so each test starts clean
export async function resetDb() {
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.user.deleteMany();
}

let counter = 0;

export async function createUser(balance = 3) {
  counter++;
  const user = await prisma.user.create({
    data: { name: `User${counter}`, email: `user${counter}@test.com`, passwordHash: 'x', balance },
  });
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  return { user, auth: { Authorization: `Bearer ${token}` } };
}

// An offer with `slots` free slots
export async function createOffer(userId, { price = 1, slots = 1 } = {}) {
  const offer = await prisma.offer.create({
    data: { userId, title: 'Offer', description: 'Desc', category: 'Coding', price },
  });
  const slotIds = [];
  for (let i = 0; i < slots; i++) {
    const slot = await prisma.slot.create({
      data: { offerId: offer.id, date: new Date('2030-01-01'), startTime: `1${i}:00`, endTime: `1${i}:59` },
    });
    slotIds.push(slot.id);
  }
  return { offer, slotIds };
}
