import { z } from 'zod';
import { baseCaseSchema, markableTextSchema } from '../../../../content/schemas.ts';

/** Permintaan karyawan untuk membuka/mengizinkan sebuah alamat web. */
export const urlRequestDataSchema = z.strictObject({
  requester: z.strictObject({
    name: z.string().trim().min(1),
    department: z.string().trim().min(1),
  }),
  /** URL dipecah menjadi bagian (skema, subdomain, domain, path) agar tiap bagian bisa ditandai. */
  url: z.strictObject({ parts: z.array(markableTextSchema).min(1) }),
  reason: markableTextSchema,
});

export const urlRequestCaseSchema = baseCaseSchema.extend({
  type: z.literal('url-request'),
  data: urlRequestDataSchema,
});

export type UrlRequestCase = z.infer<typeof urlRequestCaseSchema>;
