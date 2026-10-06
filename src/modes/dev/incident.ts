/**
 * Insiden produksi "server terbakar" (ADR 026, game feel tahap 2): kesehatan server turun mengikuti
 * jam shift sejak kasus dibuka, sampai pemain melakukan rollback darurat atau mengirim perbaikan.
 * Murni: dihitung dari waktu jam shift, jadi tetap benar saat dijeda atau dilanjutkan.
 */
import type { CaseCore, CaseOutcome, PlayerInput } from '../../engine/types.ts';

export const DEFAULT_DRAIN_PER_SECOND = 2;

export function serverHealth(p: {
  openedAtMs: number;
  nowMs: number;
  rolledBackAtMs?: number | undefined;
  drainPerSecond: number;
}): number {
  const until = Math.min(p.nowMs, p.rolledBackAtMs ?? p.nowMs);
  const lost = (Math.max(0, until - p.openedAtMs) / 1000) * p.drainPerSecond;
  return Math.max(0, Math.min(100, Math.round(100 - lost)));
}

/**
 * Nilai = bagian tes yang lulus (seperti tugas coding). Komponen kedua = sisa kesehatan server
 * (min 0,3). Server sempat DOWN tanpa rollback = pengguna terdampak, walau perbaikannya benar.
 */
export function evaluateIncident(
  c: CaseCore,
  drainPerSecond: number,
  input: PlayerInput,
): CaseOutcome {
  const a = input.answer;
  const score = a?.total ? (a.passed ?? 0) / a.total : 0;
  const health = input.timing
    ? serverHealth({ ...input.timing, rolledBackAtMs: a?.rolledBackAtMs, drainPerSecond })
    : 100;
  const down = health === 0;
  const correct = score === 1 && !down;
  return {
    caseId: c.id,
    decision: input.decision,
    verdict: c.verdict,
    severity: c.severity,
    impact: down ? 'threat-allowed' : correct ? 'correct' : score > 0 ? 'partial' : 'wrong',
    correct,
    decisionScore: score,
    evidenceScore: Math.max(0.3, health / 100),
    missedEvidence: [],
    wrongMarks: [],
  };
}
