import { httpError } from '../lib/httpError.js';
import prisma from '../lib/prisma.js';
import { checkTransition } from './bookingRules.js';
import { reservedCredits, transferCredits } from './walletService.js';

const bookingInclude = {
  offer: { select: { id: true, title: true } },
  slot: true,
  requester: { select: { id: true, name: true } },
  provider: { select: { id: true, name: true } },
  review: true,
};

export async function requestBooking(userId, slotId) {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: slotId }, include: { offer: true } });
    if (!slot) throw httpError(404, 'Slot not found');
    const { offer } = slot;
    if (offer.userId === userId) throw httpError(400, 'You cannot book your own offer');

    // Balance minus the cost of my other open bookings must stay >= 0
    const me = await tx.user.findUnique({ where: { id: userId } });
    const available = me.balance - (await reservedCredits(userId, tx));
    if (available < offer.price) {
      throw httpError(400, `Not enough credits: you have ${available} available, this costs ${offer.price}`);
    }

    // Atomic: only one request can flip FREE to BOOKED
    const claimed = await tx.slot.updateMany({
      where: { id: slotId, status: 'FREE' },
      data: { status: 'BOOKED' },
    });
    if (claimed.count === 0) throw httpError(409, 'Slot already taken');

    return tx.booking.create({
      data: {
        offerId: offer.id,
        slotId,
        requesterId: userId,
        providerId: offer.userId,
        cost: offer.price,
      },
      include: bookingInclude,
    });
  });
}

export async function changeStatus(userId, bookingId, newStatus) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw httpError(404, 'Booking not found');
  checkTransition(booking, newStatus, userId);

  return prisma.$transaction(async (tx) => {
    // Only change the booking if nobody changed it since we read it
    const changed = await tx.booking.updateMany({
      where: { id: bookingId, status: booking.status },
      data: { status: newStatus },
    });
    if (changed.count === 0) throw httpError(409, 'Booking was just changed, please reload');

    // Declined or cancelled: the slot can be booked again
    if (newStatus === 'DECLINED' || newStatus === 'CANCELLED') {
      await tx.slot.update({ where: { id: booking.slotId }, data: { status: 'FREE' } });
    }
    // Completed: credits move now (and only now)
    if (newStatus === 'COMPLETED') await transferCredits(tx, booking);

    return tx.booking.findUnique({ where: { id: bookingId }, include: bookingInclude });
  });
}

// role is 'requested' (I asked for help) or 'received' (others asked me)
export function listBookings(userId, role) {
  const where = role === 'received' ? { providerId: userId } : { requesterId: userId };
  return prisma.booking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: bookingInclude,
  });
}
