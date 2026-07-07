import { z } from 'zod';
import { businessmanBaseShape } from './businessman.schema.js';

// Public self-registration: photo and transaction id are required.
export const registrationSchema = z.object({
  ...businessmanBaseShape,
  profile_photo_url: z.string({ message: 'ছবি আবশ্যক।' }).url('সঠিক ছবির লিংক দিন।').max(1000),
  transaction_id: z.string().trim().min(4, 'বিকাশ ট্রানজেকশন আইডি আবশ্যক।').max(60),
});

export const rejectSchema = z.object({
  reason: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});

export const requestQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});
