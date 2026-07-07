import { z } from 'zod';

const optionalText = z.preprocess(
  (v) => (v === null ? undefined : v),
  z.string().max(20000).optional(),
);

export const pageParamSchema = z.object({
  pageKey: z.enum(['home', 'about', 'contact', 'rules']),
});

export const pageUpdateSchema = z.object({
  title_bn: optionalText,
  title_en: optionalText,
  subtitle_bn: optionalText,
  subtitle_en: optionalText,
  body_bn: optionalText,
  body_en: optionalText,
  extra: z.record(z.string(), z.any()).optional(),
});
