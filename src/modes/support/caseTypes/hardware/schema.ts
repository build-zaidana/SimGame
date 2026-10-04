import { z } from 'zod';
import { baseCaseSchema, markableTextSchema } from '../../../../content/schemas.ts';

/** Inspeksi fisik perangkat di meja bengkel: bagian yang diperiksa + pengamatan. */
export const hardwareCaseSchema = baseCaseSchema.extend({
  type: z.literal('hardware'),
  data: z.strictObject({
    device: z.strictObject({ name: z.string().min(1), owner: z.string().min(1) }),
    checks: z
      .array(
        z.strictObject({
          part: z.string().min(1),
          observation: z.string().min(1),
          evidenceId: z.string().min(1).optional(),
        }),
      )
      .min(1)
      .max(8),
    note: markableTextSchema.optional(),
  }),
});
export type HardwareCase = z.infer<typeof hardwareCaseSchema>;
