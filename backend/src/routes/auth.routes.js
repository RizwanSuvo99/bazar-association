import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.schema.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAdmin, authController.me);
router.post(
  '/change-password',
  requireAdmin,
  loginLimiter,
  validate(changePasswordSchema),
  authController.changePassword,
);

export default router;
