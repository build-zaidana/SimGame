import { z } from 'zod';
import { baseCaseSchema, idSchema, markableTextSchema } from '../../../../content/schemas.ts';

const t = z.string().trim().min(1);

/** Satu baris log login; satu baris = satu bukti. */
export const loginEventSchema = z.strictObject({
  time: t,
  location: t,
  ip: t,
  device: t,
  method: t.optional(),
  result: z.enum(['success', 'failed']),
  evidenceId: idSchema.optional(),
});

export const loginAlertDataSchema = z.strictObject({
  account: z.strictObject({ user: t, role: t }),
  headline: markableTextSchema,
  events: z.array(loginEventSchema).min(1).max(8),
  /** Info pendukung (absensi, tiket, catatan telepon). */
  context: z.array(markableTextSchema).default([]),
});

export const loginAlertCaseSchema = baseCaseSchema.extend({
  type: z.literal('login-alert'),
  data: loginAlertDataSchema,
});

export type LoginAlertCase = z.infer<typeof loginAlertCaseSchema>;
