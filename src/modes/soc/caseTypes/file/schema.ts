import { z } from 'zod';
import { baseCaseSchema, markableTextSchema } from '../../../../content/schemas.ts';

/** File yang diterima karyawan (lampiran email, kiriman chat, flashdisk). */
export const fileDataSchema = z.strictObject({
  fileName: markableTextSchema,
  fileType: markableTextSchema,
  size: markableTextSchema,
  source: markableTextSchema,
  message: markableTextSchema,
});

export const fileCaseSchema = baseCaseSchema.extend({
  type: z.literal('file'),
  data: fileDataSchema,
});

export type FileCase = z.infer<typeof fileCaseSchema>;
