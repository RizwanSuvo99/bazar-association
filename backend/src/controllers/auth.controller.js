import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/respond.js';
import { signToken } from '../utils/jwt.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { env } from '../config/env.js';
import {
  findAdminByEmail,
  findAdminById,
  touchLastLogin,
  updateAdminPassword,
} from '../models/admin.model.js';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    maxAge: env.COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

function publicAdmin(admin) {
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await findAdminByEmail(email);
  // Generic failure to avoid user enumeration.
  if (!admin || !admin.is_active) throw ApiError.unauthorized('ইমেইল বা পাসওয়ার্ড ভুল।', 'INVALID_CREDENTIALS');

  const okPass = await comparePassword(password, admin.password_hash);
  if (!okPass) throw ApiError.unauthorized('ইমেইল বা পাসওয়ার্ড ভুল।', 'INVALID_CREDENTIALS');

  const token = signToken({ sub: admin.id, role: admin.role });
  res.cookie(env.COOKIE_NAME, token, cookieOptions());
  await touchLastLogin(admin.id);
  return ok(res, { admin: publicAdmin(admin) });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  return ok(res, { message: 'লগআউট সম্পন্ন হয়েছে।' });
});

export const me = asyncHandler(async (req, res) => {
  return ok(res, { admin: req.admin });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { current_password: currentPassword, new_password: newPassword } = req.body;

  const admin = await findAdminById(req.admin.id);
  if (!admin) throw ApiError.unauthorized('অ্যাকাউন্ট পাওয়া যায়নি।', 'ADMIN_NOT_FOUND');

  const okPass = await comparePassword(currentPassword, admin.password_hash);
  if (!okPass) throw ApiError.badRequest('বর্তমান পাসওয়ার্ড ভুল।', 'WRONG_CURRENT_PASSWORD');

  await updateAdminPassword(admin.id, await hashPassword(newPassword));

  // The old cookie is now stale (issued before password_changed_at), so mint a fresh
  // one — this device stays signed in while every other session is invalidated.
  const token = signToken({ sub: admin.id, role: admin.role });
  res.cookie(env.COOKIE_NAME, token, cookieOptions());

  return ok(res, { message: 'পাসওয়ার্ড পরিবর্তন হয়েছে। অন্য ডিভাইসগুলো থেকে লগআউট হয়ে গেছে।' });
});
