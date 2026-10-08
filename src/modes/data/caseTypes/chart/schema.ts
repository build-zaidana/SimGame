import { z } from 'zod';
import { baseCaseSchema, idSchema, markableTextSchema } from '../../../../content/schemas.ts';

/**
 * Grafik/laporan dari rekan yang akan diterbitkan (ADR 031): pemain memeriksa apakah grafiknya
 * jujur (sumbu, sampel, klaim) lalu Setujui/Revisi/Eskalasi.
 */
export const chartCaseSchema = baseCaseSchema.extend({
  type: z.literal('chart'),
  data: z.strictObject({
    author: z.strictObject({ name: z.string().min(1), team: z.string().min(1) }),
    title: z.string().trim().min(1),
    /** Ke mana laporan ini akan dikirim, mis. "Rapat direksi besok pagi". */
    purpose: z.string().trim().min(1),
    chart: z.strictObject({
      kind: z.enum(['bar', 'line']),
      title: z.string().trim().min(1),
      unit: z.string().trim().min(1),
      /** Nilai awal sumbu Y. Lebih dari 0 pada grafik batang = perbedaan tampak dibesar-besarkan. */
      axisStart: z.number().default(0),
      /** Bukti untuk keterangan sumbu ("Sumbu Y dimulai dari …"). */
      axisEvidenceId: idSchema.optional(),
      points: z
        .array(
          z.strictObject({
            label: z.string().trim().min(1),
            value: z.number(),
            evidenceId: idSchema.optional(),
          }),
        )
        .min(2)
        .max(8),
    }),
    claims: z.array(markableTextSchema).min(1).max(3),
    notes: z.array(markableTextSchema).max(3).default([]),
  }),
});
export type ChartCase = z.infer<typeof chartCaseSchema>;
