import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getWallet } from '../services/walletService.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  res.json(await getWallet(req.userId));
});

export default router;
