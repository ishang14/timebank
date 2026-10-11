import { httpError } from '../lib/httpError.js';
import prisma from '../lib/prisma.js';

// Credits already promised to other open bookings (requested or accepted)
export async function reservedCredits(userId, db = prisma) {
  const result = await db.booking.aggregate({
    where: { requesterId: userId, status: { in: ['REQUESTED', 'ACCEPTED'] } },
    _sum: { cost: true },
  });
  return result._sum.cost || 0;
}

// Moves credits from requester to provider. Must run inside a prisma.$transaction
// so both balances and the transaction row change together or not at all.
export async function transferCredits(tx, booking) {
  try {
    await tx.user.update({
      where: { id: booking.requesterId },
      data: { balance: { decrement: booking.cost } },
    });
  } catch (err) {
    // The database CHECK constraint rejects a negative balance
    if (String(err.message).includes('users_balance_non_negative')) {
      throw httpError(409, 'Not enough credits to complete this booking');
    }
    throw err;
  }
  await tx.user.update({
    where: { id: booking.providerId },
    data: { balance: { increment: booking.cost } },
  });
  await tx.transaction.create({
    data: {
      fromUserId: booking.requesterId,
      toUserId: booking.providerId,
      amount: booking.cost,
      bookingId: booking.id,
    },
  });
}

export async function getWallet(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const transactions = await prisma.transaction.findMany({
    where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      from: { select: { id: true, name: true } },
      to: { select: { id: true, name: true } },
      booking: { select: { offer: { select: { title: true } } } },
    },
  });
  return { balance: user.balance, transactions };
}
