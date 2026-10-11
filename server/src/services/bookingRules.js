import { httpError } from '../lib/httpError.js';

// Allowed status changes and who may make them
const TRANSITIONS = {
  REQUESTED: { ACCEPTED: 'provider', DECLINED: 'provider', CANCELLED: 'either' },
  ACCEPTED: { CANCELLED: 'either', COMPLETED: 'requester' },
};

// Throws a clear error unless this user may move the booking to newStatus
export function checkTransition(booking, newStatus, userId) {
  const who = TRANSITIONS[booking.status]?.[newStatus];
  if (!who) {
    throw httpError(400, `Cannot change a ${booking.status} booking to ${newStatus}`);
  }
  const isRequester = userId === booking.requesterId;
  const isProvider = userId === booking.providerId;
  const allowed = who === 'either' ? isRequester || isProvider : who === 'requester' ? isRequester : isProvider;
  if (!allowed) {
    throw httpError(403, `Only the ${who === 'either' ? 'requester or provider' : who} can do this`);
  }
}
