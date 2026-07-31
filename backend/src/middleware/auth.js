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

  // A token minted before the last password change is stale — changing the password
  // signs out every other device. `iat` is in seconds; allow 1s of clock slack.
  if (admin.password_changed_at && payload.iat) {
    const changedAtSec = Math.floor(new Date(admin.password_changed_at).getTime() / 1000);
    if (payload.iat < changedAtSec - 1) {
      throw ApiError.unauthorized('পাসওয়ার্ড পরিবর্তিত হয়েছে। আবার লগইন করুন।', 'PASSWORD_CHANGED');
    }
  }

  req.admin = { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
  next();
});

/** Gate for admin-account management — only superadmins may add or modify admins. */
export const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== 'superadmin') {
    return next(ApiError.forbidden('এই কাজটি শুধুমাত্র সুপার অ্যাডমিন করতে পারেন।', 'SUPERADMIN_ONLY'));
  }
  next();
};
