import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Emails are stored in lowercase so "Ann@x.com" and "ann@x.com" are the same account
const email = z.string().trim().toLowerCase().email('Invalid email');

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

// Never send the password hash to the client
const publicUser = ({ id, name, email, balance }) => ({ id, name, email, balance });
const makeToken = (user) =>
  jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/signup', validate(signupSchema), async (req, res) => {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  // A duplicate email is rejected by the database and becomes a 409 in the error handler
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  res.status(201).json({ token: makeToken(user), user: publicUser(user) });
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  res.json({ token: makeToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: publicUser(user) });
});

export default router;
