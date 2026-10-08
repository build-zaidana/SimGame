import { z } from 'zod';
import { baseCaseSchema } from '../../../../content/schemas.ts';

const cellSchema = z.union([z.string(), z.number(), z.null()]);

/** Tabel SQLite kecil (ADR 031). Nama tabel & kolom: huruf kecil + garis bawah, mudah diketik. */
export const sqlTableSchema = z.strictObject({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  columns: z
    .array(
      z.strictObject({
        name: z.string().regex(/^[a-z][a-z0-9_]*$/),
        type: z.enum(['TEXT', 'INTEGER', 'REAL']),
      }),
    )
    .min(1)
    .max(6),
  rows: z.array(z.array(cellSchema)).min(1).max(14),
});

/**
 * Tugas query: tulis (`build`) atau perbaiki (`fix`) query SQL. Hasilnya dibandingkan dengan query
 * acuan di set data yang terlihat dan di set data tersembunyi (agar jawaban tidak bisa dihafal).
 */
export const queryCaseSchema = baseCaseSchema.extend({
  type: z.literal('query'),
  data: z.strictObject({
    task: z.enum(['fix', 'build']),
    requester: z.strictObject({ name: z.string().min(1), team: z.string().min(1) }),
    title: z.string().trim().min(1),
    story: z.array(z.string().trim().min(1)).min(1).max(3),
    tables: z.array(sqlTableSchema).min(1).max(3),
    /** Set data uji tersembunyi: tabel dengan nama & kolom yang sama, isi berbeda. */
    hidden: z
      .array(z.strictObject({ tables: z.array(sqlTableSchema).min(1).max(3) }))
      .min(1)
      .max(2),
    /** Query awal di editor (boleh hanya komentar untuk `build`). */
    starter: z.string(),
    /** Query acuan: tidak ditampilkan; content:check memastikan hasilnya berbeda antar set data. */
    solution: z.string().min(1),
    /** Urutan baris ikut dinilai (tugas yang meminta ORDER BY). */
    ordered: z.boolean().default(false),
  }),
});
export type QueryCase = z.infer<typeof queryCaseSchema>;
