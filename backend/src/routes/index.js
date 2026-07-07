import { Router } from 'express';
import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    return ok(res, { status: 'ok', time: new Date().toISOString() });
  }),
);

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/', publicRoutes);

export default router;
