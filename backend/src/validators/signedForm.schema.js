import { z } from 'zod';

/** Which copy the public token page should show: the signed upload, or the generated form. */
export const signedFormVisibilitySchema = z.object({
  visible: z.boolean({ message: 'দেখানোর অবস্থা নির্বাচন করুন।' }),
});
