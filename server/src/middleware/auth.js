import jwt from 'jsonwebtoken';

// Protects a route: needs "Authorization: Bearer <token>"
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
    next();
  } catch {
    res.status(401).json({ error: 'Not logged in' });
  }
}
