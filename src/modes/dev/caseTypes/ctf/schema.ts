import { z } from 'zod';
import { baseCaseSchema } from '../../../../content/schemas.ts';

/**
 * CTF defensif (ADR 026): teka-teki menemukan bendera FLAG{...} dengan membaca kode/log dan
 * memakai Python (mis. membalik sandi Caesar, membaca Base64). Bukan cara membobol sistem.
 */
export const ctfCaseSchema = baseCaseSchema.extend({
  type: z.literal('ctf'),
  data: z.strictObject({
    title: z.string().trim().min(1),
    story: z.array(z.string().trim().min(1)).min(1).max(3),
    artifacts: z
      .array(
        z.strictObject({
          label: z.string().trim().min(1),
          kind: z.enum(['code', 'text']),
          content: z.string().min(1),
        }),
      )
      .min(1)
      .max(3),
    /** Kode awal konsol coba-coba. */
    scratch: z.string().min(1),
    flag: z.string().regex(/^FLAG\{[A-Za-z0-9_-]+\}$/, 'bendera harus berbentuk FLAG{...}'),
    /** Program acuan yang mencetak bendera; diperiksa content:check. */
    solution: z.string().min(1),
  }),
});
export type CtfCase = z.infer<typeof ctfCaseSchema>;
