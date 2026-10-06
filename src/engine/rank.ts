/**
 * Pangkat karier per mode (ADR 027): Magang → Junior → Menengah → Senior → Lead.
 * Dihitung dari shift jalur utama yang selesai (bukan disimpan), jadi selalu sinkron dengan save
 * dan setiap pangkat bisa diraih: Mode Latihan tidak mengubah progres, jadi syarat bintang di
 * shift yang sudah lewat tidak akan pernah bisa dikejar lagi.
 */
export const RANK_COUNT = 5;

/** Tunjangan jabatan per shift untuk setiap pangkat. */
const PAY_BONUS = [0, 10, 20, 30, 40] as const;

export interface RankInput {
  completedShifts: number;
  totalShifts: number;
}

/** Shift selesai minimum untuk pangkat 1..4 (pangkat 0 = belum ada). */
function thresholds(total: number): number[] {
  return [1, Math.ceil(total / 2), Math.max(1, total - 1), total];
}

export function careerRank({ completedShifts, totalShifts }: RankInput): number {
  if (totalShifts <= 0) return 0;
  return thresholds(totalShifts).filter((min) => completedShifts >= min).length;
}

export function rankPayBonus(rank: number): number {
  return PAY_BONUS[Math.max(0, Math.min(RANK_COUNT - 1, rank))] ?? 0;
}

/** Syarat pangkat berikutnya; null bila sudah di puncak. */
export function nextRankGoal(input: RankInput): { rank: number; shiftsLeft: number } | null {
  const rank = careerRank(input);
  if (rank >= RANK_COUNT - 1 || input.totalShifts <= 0) return null;
  const min = thresholds(input.totalShifts)[rank] ?? input.totalShifts;
  return { rank: rank + 1, shiftsLeft: min - input.completedShifts };
}
