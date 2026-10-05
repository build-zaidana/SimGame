import { z } from 'zod';
import { baseCaseSchema, codeLineSchema, markableTextSchema } from '../../../../content/schemas.ts';

/** Laporan bug dari pengguna: langkah, harapan vs kenyataan, pesan error, potongan kode. */
export const bugReportCaseSchema = baseCaseSchema.extend({
  type: z.literal('bug-report'),
  data: z.strictObject({
    reporter: z.strictObject({ name: z.string().min(1), department: z.string().min(1) }),
    title: markableTextSchema,
    steps: z.array(markableTextSchema).min(1).max(4),
    expected: markableTextSchema,
    actual: markableTextSchema,
    file: z.string().min(1).optional(),
    code: z.array(codeLineSchema).max(10).default([]),
    error: z.array(markableTextSchema).max(5).default([]),
  }),
});
export type BugReportCase = z.infer<typeof bugReportCaseSchema>;
