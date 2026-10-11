import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import offerRoutes from './routes/offers.js';
import reviewRoutes from './routes/reviews.js';
import statsRoutes from './routes/stats.js';
import userRoutes from './routes/users.js';
import walletRoutes from './routes/wallet.js';

const app = express();
// We sit behind one proxy (nginx or the Vite dev server), so req.ip is the real visitor, not the proxy.
// This matters for the per-IP login rate limit.
app.set('trust proxy', 1);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/stats', statsRoutes);

// Unknown /api paths get JSON, not Express's default HTML page
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorHandler);

export default app;
