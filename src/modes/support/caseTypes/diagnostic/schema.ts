import { z } from 'zod';
import { baseCaseSchema, markableTextSchema } from '../../../../content/schemas.ts';

/** Laporan diagnostik otomatis: angka sistem + keluaran konsol (mis. ping, ipconfig). */
export const diagnosticCaseSchema = baseCaseSchema.extend({
  type: z.literal('diagnostic'),
  data: z.strictObject({
    device: z.strictObject({ name: z.string().min(1), owner: z.string().min(1) }),
    readings: z
      .array(
        z.strictObject({
          label: z.string().min(1),
          value: z.string().min(1),
          evidenceId: z.string().min(1).optional(),
        }),
      )
      .min(1)
      .max(8),
    console: z.array(markableTextSchema).max(8).default([]),
    note: markableTextSchema.optional(),
  }),
});
export type DiagnosticCase = z.infer<typeof diagnosticCaseSchema>;
