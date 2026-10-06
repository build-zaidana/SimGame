import type { CaseCore, DecisionId, EvidenceId, PlayMode } from './types.ts';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** 1 jika benar, bobot `acceptableDecisions` jika ada, selain itu 0 (ARCHITECTURE §6.2). */
export function scoreDecision(c: CaseCore, decision: DecisionId): number {
  if (decision === c.correctDecision) return 1;
  return c.acceptableDecisions[decision] ?? 0;
}

export interface EvidenceResult {
  score: number;
  missed: EvidenceId[];
  wrong: EvidenceId[];
}

/** Recall bukti wajib − 0,25 per tandai yang salah + 0,05 per bukti pendukung, di-clamp ke [0, 1]. */
export function scoreEvidence(
  evidence: CaseCore['evidence'],
  marks: readonly EvidenceId[],
): EvidenceResult {
  const marked = new Set(marks);
  const required = new Set(evidence.required);
  const supporting = new Set(evidence.supporting);
  const missed = evidence.required.filter((id) => !marked.has(id));
  const wrong = [...marked].filter((id) => !required.has(id) && !supporting.has(id));
  const supportHits = [...marked].filter((id) => supporting.has(id)).length;
  const recall = required.size === 0 ? 1 : (required.size - missed.length) / required.size;
  const raw = recall - 0.25 * wrong.length + 0.05 * supportHits;
  return { score: clamp(Math.round(raw * 1000) / 1000, 0, 1), missed, wrong };
}

export interface CaseScoreInput {
  decisionScore: number;
  evidenceScore: number;
  hintsUsed: number;
  timeBonus: number;
  /** Petunjuk gratis per kasus (bawaan 1; Mesin kopi menambahnya). */
  freeHints?: number;
}

/** Skor kasus 0–100. Petunjuk pertama gratis (atau sebanyak `freeHints`); berikutnya −10. */
export function caseScore({
  decisionScore,
  evidenceScore,
  hintsUsed,
  timeBonus,
  freeHints = 1,
}: CaseScoreInput): number {
  const evidenceWeight = decisionScore > 0 ? 1 : 0.5;
  const raw =
    60 * decisionScore +
    40 * evidenceScore * evidenceWeight -
    10 * Math.max(0, hintsUsed - freeHints) +
    timeBonus;
  return clamp(Math.round(raw), 0, 100);
}

const TIME_BONUS_WINDOW_MS = 60_000;

/** Bonus waktu ≤ 10, hanya di mode Normal dan hanya untuk keputusan yang benar. */
export function timeBonus(playMode: PlayMode, decisionScore: number, decideMs: number): number {
  if (playMode !== 'normal' || decisionScore < 1) return 0;
  return Math.round(10 * clamp(1 - decideMs / TIME_BONUS_WINDOW_MS, 0, 1));
}

/** ★ ≥ 50, ★★ ≥ 70, ★★★ ≥ 85 dengan kepercayaan ≥ 70. */
export function shiftStars(averageScore: number, trust: number): 0 | 1 | 2 | 3 {
  if (averageScore >= 85 && trust >= 70) return 3;
  if (averageScore >= 70) return 2;
  if (averageScore >= 50) return 1;
  return 0;
}
