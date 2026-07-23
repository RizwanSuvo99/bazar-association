import { z } from 'zod';
import { businessmanBaseShape, requiredStr, mobile, BLOOD_GROUPS } from './businessman.schema.js';

const requiredBloodGroup = z.enum(BLOOD_GROUPS, { message: 'সঠিক রক্তের গ্রুপ নির্বাচন করুন।' });

// Public self-registration: every applicant information field is required.
// Payment is either bKash (transaction id required as proof) or cash/hand-to-hand
// (no proof — an admin confirms it manually), defaulting to bKash.
export const registrationSchema = z
  .object({
    ...businessmanBaseShape,
    // Make the otherwise-optional applicant fields mandatory for self-registration.
    father_name: requiredStr,
    mother_name: requiredStr,
    blood_group: requiredBloodGroup,
    village: requiredStr,
    post_office: requiredStr,
    municipality_or_union: requiredStr,
    upazila: requiredStr,
    district: requiredStr,
    current_business_name_address: requiredStr,
    business_type: requiredStr,
    trade_license_no: requiredStr,
    tin_no: requiredStr,
    market_name: requiredStr,
    owner_name: requiredStr,
    ward_no: requiredStr,
    holding_no: requiredStr,
    nominee_name: requiredStr,
    nominee_relation: requiredStr,
    nominee_mobile: mobile,
    profile_photo_url: z.string({ message: 'ছবি আবশ্যক।' }).url('সঠিক ছবির লিংক দিন।').max(1000),
    payment_method: z.preprocess(
      (v) => (v === '' || v == null ? 'bkash' : v),
      z.enum(['bkash', 'cash'], { message: 'পেমেন্ট পদ্ধতি নির্বাচন করুন।' }),
    ),
    transaction_id: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z.string().trim().min(4, 'বিকাশ ট্রানজেকশন আইডি আবশ্যক।').max(60).optional(),
    ),
  })
  .superRefine((data, ctx) => {
    // bKash needs a transaction id; cash needs none (dropped so it isn't stored).
    if (data.payment_method === 'bkash') {
      if (!data.transaction_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['transaction_id'],
          message: 'বিকাশ ট্রানজেকশন আইডি আবশ্যক।',
        });
      }
    } else {
      data.transaction_id = undefined;
    }
  });

export const rejectSchema = z.object({
  reason: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().trim().max(500).optional(),
  ),
});

export const requestQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
