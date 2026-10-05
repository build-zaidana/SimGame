import { z } from 'zod';
import { baseCaseSchema, markableTextSchema } from '../../../../content/schemas.ts';

/** Peringatan dari aplikasi yang sudah rilis (produksi): rilis terakhir, angka, dan log. */
export const incidentCaseSchema = baseCaseSchema.extend({
  type: z.literal('incident'),
  data: z.strictObject({
    service: z.string().min(1),
    summary: markableTextSchema,
    deploys: z
      .array(
        z.strictObject({
          time: z.string().min(1),
          version: z.string().min(1),
          note: z.string().min(1),
          evidenceId: z.string().min(1).optional(),
        }),
      )
      .min(1)
      .max(4),
    metrics: z
      .array(
        z.strictObject({
          label: z.string().min(1),
          value: z.string().min(1),
          evidenceId: z.string().min(1).optional(),
        }),
      )
      .min(1)
      .max(6),
    log: z.array(markableTextSchema).max(6).default([]),
    note: markableTextSchema.optional(),
  }),
});
export type IncidentCase = z.infer<typeof incidentCaseSchema>;
