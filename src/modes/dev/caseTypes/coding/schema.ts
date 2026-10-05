import { z } from 'zod';
import { baseCaseSchema } from '../../../../content/schemas.ts';

/** Tes Python: kode `assert` yang dijalankan setelah kode pemain (ADR 026). */
export const pyTestSchema = z.strictObject({
  name: z.string().trim().min(1),
  code: z.string().min(1),
  /** Tes tersembunyi: namanya tidak ditampilkan (kasus tepi ala lomba coding). */
  hidden: z.boolean().optional(),
});

/** Tugas coding: perbaiki bug (`fix`) atau tulis fungsi dari awal (`build`, ala lomba coding). */
export const codingCaseSchema = baseCaseSchema.extend({
  type: z.literal('coding'),
  data: z.strictObject({
    task: z.enum(['fix', 'build']),
    requester: z.strictObject({ name: z.string().min(1), team: z.string().min(1) }),
    title: z.string().trim().min(1),
    story: z.array(z.string().trim().min(1)).min(1).max(3),
    file: z.string().min(1),
    /** Kode awal di editor (tidak di-trim agar indentasi utuh). */
    starter: z.string().min(1),
    tests: z.array(pyTestSchema).min(1).max(6),
    /** Solusi acuan: tidak ditampilkan; content:check memastikan lulus semua tes. */
    solution: z.string().min(1),
  }),
});
export type CodingCase = z.infer<typeof codingCaseSchema>;
