import { z } from 'zod';
import { baseCaseSchema } from '../../../../content/schemas.ts';

export const robotMapSchema = z.strictObject({
  /** '#' dinding, '.' lantai, 'P' paket, 'T' tujuan; pinggir wajib dinding. */
  grid: z
    .array(z.string().regex(/^[#.PT]{3,12}$/, 'baris peta hanya boleh berisi # . P T (3–12 kolom)'))
    .min(3)
    .max(9),
  start: z.strictObject({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    dir: z.enum(['N', 'E', 'S', 'W']),
  }),
});

/**
 * Robot kurir (ADR 026): program Python menggerakkan robot pengantar paket. Program yang sama diuji di
 * beberapa peta, jadi pemain perlu if/while dan sensor, bukan menghafal langkah.
 */
export const robotCaseSchema = baseCaseSchema.extend({
  type: z.literal('robot'),
  data: z.strictObject({
    requester: z.strictObject({ name: z.string().min(1), team: z.string().min(1) }),
    title: z.string().trim().min(1),
    story: z.array(z.string().trim().min(1)).min(1).max(3),
    maps: z.array(robotMapSchema).min(1).max(3),
    /** Kode awal di editor. */
    starter: z.string().min(1),
    /** Solusi acuan: content:check memastikan berhasil di semua peta. */
    solution: z.string().min(1),
  }),
});
export type RobotCase = z.infer<typeof robotCaseSchema>;
