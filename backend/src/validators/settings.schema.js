import { z } from 'zod';
import { normalizeDigits } from '../utils/digits.js';

const optionalStr = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().trim().max(500).optional(),
);

const optionalUrl = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().url('সঠিক লিংক দিন।').max(1000).optional(),
);

export const settingsUpdateSchema = z.object({
  org_name_bn: optionalStr,
  org_name_en: optionalStr,
  bkash_number: z.preprocess(
    (v) => (v === '' || v == null ? undefined : normalizeDigits(v).replace(/\s/g, '')),
    z.string().regex(/^01[3-9]\d{8}$/, 'সঠিক বিকাশ নম্বর দিন।').optional(),
  ),
  registration_fee: z.coerce.number().int().min(0).max(100000).optional(),
  active_theme: z.enum(['emerald', 'royal-blue', 'warm-amber', 'crimson']).optional(),
  logo_url: optionalUrl,
  contact_email: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().email('সঠিক ইমেইল দিন।').optional(),
  ),
  contact_phone: optionalStr,
  contact_address_bn: optionalStr,
  contact_address_en: optionalStr,
  facebook_url: optionalUrl,
  hero_images: z
    .array(
      z.object({
        url: z.string().url('সঠিক ছবির লিংক দিন।').max(1000),
        public_id: z.string().max(300).nullable().optional(),
      }),
    )
    .max(12, 'সর্বোচ্চ ১২টি ছবি যোগ করা যাবে।')
    .optional(),
});
