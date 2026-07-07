import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { findAdminById } from '../models/admin.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) {
    throw ApiError.unauthorized('লগইন প্রয়োজন।', 'NO_TOKEN');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('সেশন মেয়াদোত্তীর্ণ। আবার লগইন করুন।', 'INVALID_TOKEN');
  }

  const admin = await findAdminById(payload.sub);
  if (!admin || !admin.is_active) {
    throw ApiError.unauthorized('অ্যাকাউন্ট পাওয়া যায়নি বা নিষ্ক্রিয়।', 'ADMIN_INACTIVE');
  }

  req.admin = { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
  next();
});
