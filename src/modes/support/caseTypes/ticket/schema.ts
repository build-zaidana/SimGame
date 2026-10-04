import { z } from 'zod';
import { baseCaseSchema, markableTextSchema } from '../../../../content/schemas.ts';

/** Tiket keluhan dari karyawan (Bengkel IT). */
export const ticketCaseSchema = baseCaseSchema.extend({
  type: z.literal('ticket'),
  data: z.strictObject({
    requester: z.strictObject({ name: z.string().min(1), department: z.string().min(1) }),
    device: markableTextSchema,
    subject: markableTextSchema,
    description: z.array(markableTextSchema).min(1).max(6),
    history: z.array(markableTextSchema).max(4).default([]),
  }),
});
export type TicketCase = z.infer<typeof ticketCaseSchema>;
