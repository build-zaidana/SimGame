import { z } from 'zod';
import { baseCaseSchema, idSchema, markableTextSchema } from '../../../../content/schemas.ts';

const linkPartSchema = z.strictObject({
  link: z.strictObject({
    /** Teks yang terlihat di email. */
    label: z.string().trim().min(1),
    /** Alamat asli; hanya terlihat lewat tahan/klik kanan atau alat Pemeriksa Tautan. */
    href: z.string().trim().min(1),
  }),
  evidenceId: idSchema.optional(),
});

export const emailDataSchema = z.strictObject({
  from: z.strictObject({
    name: z.string().trim().min(1),
    address: z.string().trim().min(3),
    evidenceId: idSchema.optional(),
  }),
  subject: markableTextSchema,
  receivedAt: z.string().trim().min(1).optional(),
  body: z.array(z.union([linkPartSchema, markableTextSchema])).min(1),
  attachments: z
    .array(
      z.strictObject({
        name: z.string().trim().min(1),
        size: z.string().trim().min(1),
        evidenceId: idSchema.optional(),
      }),
    )
    .default([]),
});

export const emailCaseSchema = baseCaseSchema.extend({
  type: z.literal('email'),
  data: emailDataSchema,
});

export type EmailCase = z.infer<typeof emailCaseSchema>;
export type EmailBodyPart = EmailCase['data']['body'][number];
