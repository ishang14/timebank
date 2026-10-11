import { ZodError } from 'zod';

// Messages for unique-constraint errors, keyed by the column that clashed
const DUPLICATE_MESSAGES = {
  email: 'Email already in use',
  booking_id: 'This booking already has a review',
};

// Every error is returned as { error: "message" }
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues.map((i) => i.message).join(', ') });
  }
  if (err.code === 'P2002') {
    const column = [].concat(err.meta?.target)[0];
    return res.status(409).json({ error: DUPLICATE_MESSAGES[column] || 'Already exists' });
  }
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}
