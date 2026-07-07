import { z } from 'zod';

const optionalStr = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().trim().max(200).optional(),
);

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'নাম আবশ্যক।').max(120),
  email: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().email('সঠিক ইমেইল দিন।').optional(),
  ),
  phone: optionalStr,
  subject: optionalStr,
  message: z.string().trim().min(1, 'বার্তা আবশ্যক।').max(3000),
});
