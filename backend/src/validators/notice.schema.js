import { z } from 'zod';

const optionalStr = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().trim().max(300).optional(),
);

export const noticeCreateSchema = z.object({
  title_bn: z.string().trim().min(1, 'নোটিশের শিরোনাম আবশ্যক।').max(300),
  title_en: optionalStr,
  file_url: z.string().url('সঠিক ফাইল লিংক দিন।').max(1000),
  file_public_id: optionalStr.nullable(),
  file_resource_type: z.enum(['auto', 'image', 'raw']).optional().default('auto'),
  file_name: optionalStr,
  is_published: z.coerce.boolean().optional().default(true),
});

export const noticeUpdateSchema = z.object({
  title_bn: z.string().trim().min(1).max(300).optional(),
  title_en: optionalStr,
  is_published: z.coerce.boolean().optional(),
});
