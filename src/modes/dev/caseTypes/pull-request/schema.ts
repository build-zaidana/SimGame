import { z } from 'zod';
import { baseCaseSchema, codeLineSchema, markableTextSchema } from '../../../../content/schemas.ts';

/** Pull request yang menunggu review: deskripsi + diff kode Python + status pemeriksaan. */
export const pullRequestCaseSchema = baseCaseSchema.extend({
  type: z.literal('pull-request'),
  data: z.strictObject({
    author: z.strictObject({ name: z.string().min(1), team: z.string().min(1) }),
    title: markableTextSchema,
    description: z.array(markableTextSchema).min(1).max(4),
    file: z.string().min(1),
    diff: z.array(codeLineSchema).min(1).max(14),
    checks: z.array(markableTextSchema).max(4).default([]),
  }),
});
export type PullRequestCase = z.infer<typeof pullRequestCaseSchema>;
