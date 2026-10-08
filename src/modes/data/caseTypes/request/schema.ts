import { z } from 'zod';
import { baseCaseSchema, idSchema, markableTextSchema } from '../../../../content/schemas.ts';

/**
 * Permintaan ke tim data (ADR 031): berbagi data, kualitas data, data latih AI, atau jawaban
 * chatbot AI yang perlu dicek. Bisa berisi pratinjau tabel dan/atau percakapan.
 */
export const requestCaseSchema = baseCaseSchema.extend({
  type: z.literal('request'),
  data: z.strictObject({
    kind: z.enum(['share', 'quality', 'ai-train', 'ai-answer']),
    from: z.strictObject({ name: z.string().min(1), team: z.string().min(1) }),
    title: z.string().trim().min(1),
    message: z.array(markableTextSchema).min(1).max(4),
    table: z
      .strictObject({
        title: z.string().trim().min(1),
        columns: z
          .array(
            z.strictObject({ name: z.string().trim().min(1), evidenceId: idSchema.optional() }),
          )
          .min(1)
          .max(5),
        rows: z
          .array(
            z.strictObject({
              cells: z.array(z.string()).min(1).max(5),
              evidenceId: idSchema.optional(),
            }),
          )
          .min(1)
          .max(8),
      })
      .optional(),
    chat: z
      .array(
        z.strictObject({
          who: z.enum(['user', 'ai']),
          text: z.string().trim().min(1),
          evidenceId: idSchema.optional(),
        }),
      )
      .max(6)
      .optional(),
    notes: z.array(markableTextSchema).max(3).default([]),
  }),
});
export type RequestCase = z.infer<typeof requestCaseSchema>;
