import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('সঠিক ইমেইল দিন।'),
  password: z.string().min(1, 'পাসওয়ার্ড আবশ্যক।'),
});

/** Shared password strength rule for admin accounts. */
export const strongPassword = z
  .string()
  .min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।')
  .max(72, 'পাসওয়ার্ড সর্বোচ্চ ৭২ অক্ষরের হতে পারে।') // bcrypt ignores bytes past 72
  .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), {
    message: 'পাসওয়ার্ডে কমপক্ষে একটি অক্ষর ও একটি সংখ্যা থাকতে হবে।',
  });

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'বর্তমান পাসওয়ার্ড আবশ্যক।'),
    new_password: strongPassword,
    confirm_password: z.string().min(1, 'পাসওয়ার্ড নিশ্চিত করুন।'),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    path: ['confirm_password'],
    message: 'নতুন পাসওয়ার্ড দুটি মিলছে না।',
  })
  .refine((v) => v.new_password !== v.current_password, {
    path: ['new_password'],
    message: 'নতুন পাসওয়ার্ড আগেরটির থেকে ভিন্ন হতে হবে।',
  });
