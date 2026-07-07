import { z } from 'zod';
import { sanitizeNid, normalizeDigits } from '../utils/digits.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Empty string -> undefined, so optional fields don't store "".
const optionalStr = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().trim().max(500).optional(),
);

const requiredStr = z.string().trim().min(1, 'এই তথ্যটি আবশ্যক।').max(500);

const digitsOnly = (v) => (typeof v === 'string' ? normalizeDigits(v).replace(/\D/g, '') : v);

const mobile = z.preprocess(
  digitsOnly,
  z.string().regex(/^01[3-9]\d{8}$/, 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)।'),
);

const optionalMobile = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : digitsOnly(v)),
  z.string().regex(/^01[3-9]\d{8}$/, 'সঠিক মোবাইল নম্বর দিন (১১ সংখ্যা)।').optional(),
);

const nid = z.preprocess(
  (v) => (typeof v === 'string' ? sanitizeNid(v) : v),
  z.string().regex(/^(\d{10}|\d{13}|\d{17})$/, 'সঠিক জাতীয় পরিচয়পত্র নম্বর দিন (১০, ১৩ বা ১৭ সংখ্যা)।'),
);

const bloodGroup = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.enum(BLOOD_GROUPS, { message: 'সঠিক রক্তের গ্রুপ নির্বাচন করুন।' }).optional(),
);

const optionalUrl = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().url('সঠিক লিংক দিন।').max(1000).optional(),
);

// Shared applicant fields used by both admin-create and public-registration.
export const businessmanBaseShape = {
  full_name: requiredStr,
  mobile_number: mobile,
  father_name: optionalStr,
  mother_name: optionalStr,
  blood_group: bloodGroup,
  village: optionalStr,
  post_office: optionalStr,
  municipality_or_union: optionalStr,
  upazila: optionalStr,
  district: optionalStr,
  current_business_name_address: optionalStr,
  business_type: optionalStr,
  trade_license_no: optionalStr,
  tin_no: optionalStr,
  market_name: optionalStr,
  owner_name: optionalStr,
  ward_no: optionalStr,
  holding_no: optionalStr,
  voter_type: z.preprocess((v) => (v === '' || v == null ? 'ব্যবসায়ী' : v), z.string().trim().default('ব্যবসায়ী')),
  nid_no: nid,
  nominee_name: optionalStr,
  nominee_relation: optionalStr,
  nominee_mobile: optionalMobile,
  profile_photo_url: optionalUrl,
};

export const businessmanCreateSchema = z.object({
  ...businessmanBaseShape,
  status: z.enum(['active', 'inactive']).optional().default('active'),
});

export const businessmanUpdateSchema = z
  .object({
    ...businessmanBaseShape,
    status: z.enum(['active', 'inactive']).optional(),
  })
  .partial();

export const businessmanQuerySchema = z.object({
  q: optionalStr,
  name: optionalStr,
  market: optionalStr,
  business_type: optionalStr,
  union: optionalStr,
  ward: optionalStr,
  district: optionalStr,
  blood_group: optionalStr,
  mobile: optionalStr,
  status: z.enum(['active', 'inactive']).optional(),
  sort: z.enum(['newest', 'oldest', 'name_asc', 'name_desc']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(12),
});

export { BLOOD_GROUPS };
