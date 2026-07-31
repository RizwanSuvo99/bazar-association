import { z } from 'zod';
import { strongPassword } from './auth.schema.js';

const role = z.enum(['admin', 'superadmin'], {
  errorMap: () => ({ message: 'ভূমিকা সঠিক নয়।' }),
});

export const adminCreateSchema = z.object({
  name: z.string().trim().min(2, 'নাম আবশ্যক।').max(120),
  email: z.string().trim().toLowerCase().email('সঠিক ইমেইল দিন।'),
  password: strongPassword,
  role: role.default('admin'),
});

export const adminUpdateSchema = z
  .object({
    name: z.string().trim().min(2, 'নাম আবশ্যক।').max(120).optional(),
    role: role.optional(),
    is_active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'পরিবর্তনের জন্য কোনো তথ্য দেওয়া হয়নি।' });

/** Superadmin resetting another admin's password (no current-password needed). */
export const adminResetPasswordSchema = z.object({
  new_password: strongPassword,
});
