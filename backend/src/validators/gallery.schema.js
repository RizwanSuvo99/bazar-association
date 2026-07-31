import { z } from 'zod';

const optionalStr = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.string().trim().max(300).optional(),
);

/**
 * Update-only variant. An omitted key means "leave this column alone"; an empty string
 * means "clear it" and becomes null. optionalStr cannot express the second case — it
 * turns '' into undefined, so clearing a caption silently did nothing.
 */
const clearableStr = z.preprocess(
  (v) => (v === '' || v === null ? null : v),
  z.string().trim().max(300).nullable().optional(),
);

export const galleryCreateSchema = z.object({
  image_url: z.string().url('সঠিক ছবির লিংক দিন।').max(1000),
  cloudinary_public_id: optionalStr,
  caption_bn: optionalStr,
  caption_en: optionalStr,
  sort_order: z.coerce.number().int().optional(),
  is_published: z.coerce.boolean().optional(),
});

export const galleryUpdateSchema = z.object({
  image_url: z.string().url('সঠিক ছবির লিংক দিন।').max(1000).optional(),
  cloudinary_public_id: clearableStr,
  caption_bn: clearableStr,
  caption_en: clearableStr,
  sort_order: z.coerce.number().int().optional(),
  is_published: z.boolean().optional(),
});

export const galleryReorderSchema = z.object({
  items: z.array(z.object({ id: z.coerce.number().int(), sort_order: z.coerce.number().int() })).min(1),
});
