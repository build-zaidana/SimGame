import { scoreDecision, scoreEvidence } from '../../engine/scoring.ts';
import type { CaseCore, CaseImpact, CaseOutcome, PlayerInput } from '../../engine/types.ts';

/**
 * Arti keputusan Meja Developer (ADR 026), dipetakan ke dampak engine yang sama:
 * - menyetujui kode yang bermasalah → bug/celah ikut rilis (dampak terbesar),
 * - meminta revisi atau rollback padahal kodenya benar → pekerjaan baik tertahan,
 * - eskalasi kode yang benar → developer senior repot tanpa perlu.
 */
function impactOf(c: CaseCore, decision: string, decisionScore: number): CaseImpact {
  if (decision === c.correctDecision) return 'correct';
  const problem = c.verdict !== 'no-fault';
  if (problem && decision === 'approve') return 'threat-allowed';
  if (!problem && decision === 'escalate') return 'needless-escalation';
  if (!problem) return 'legit-blocked';
  return decisionScore > 0 ? 'partial' : 'wrong';
}

/** Evaluasi bersama semua tipe kasus Meja Developer. Murni: tanpa React. */
export function evaluateDevCase(c: CaseCore, input: PlayerInput): CaseOutcome {
  const decisionScore = scoreDecision(c, input.decision);
  const evidence = scoreEvidence(c.evidence, input.marks);
  return {
    caseId: c.id,
    decision: input.decision,
    verdict: c.verdict,
    severity: c.severity,
    impact: impactOf(c, input.decision, decisionScore),
    correct: decisionScore === 1,
    decisionScore,
    evidenceScore: evidence.score,
    missedEvidence: evidence.missed,
    wrongMarks: evidence.wrong,
  };
}

/** Efisiensi: 1–2 kali menjalankan tes = penuh; tiap percobaan berikutnya −0,1 (min 0,5). */
function efficiency(runs: number): number {
  return Math.max(0.5, Math.min(1, 1 - (runs - 2) * 0.1));
}

function taskOutcome(c: CaseCore, input: PlayerInput, score: number, runs: number): CaseOutcome {
  const correct = score === 1;
  return {
    caseId: c.id,
    decision: input.decision,
    verdict: c.verdict,
    severity: c.severity,
    impact: correct ? 'correct' : score > 0 ? 'partial' : 'wrong',
    correct,
    decisionScore: score,
    evidenceScore: efficiency(runs),
    missedEvidence: [],
    wrongMarks: [],
  };
}

/**
 * Tugas coding (perbaiki bug / tulis fungsi, ADR 026): nilai = bagian tes yang lulus pada kode
 * yang dikirim; "bukti" diganti efisiensi (sedikit percobaan). Hasil tes dari worker MicroPython.
 */
export function evaluateCodingCase(c: CaseCore, input: PlayerInput): CaseOutcome {
  const a = input.answer;
  const score = a?.total ? (a.passed ?? 0) / a.total : 0;
  return taskOutcome(c, input, score, a?.runs ?? 0);
}

/** CTF: bendera yang diketik harus sama persis (spasi di tepi diabaikan). */
export function evaluateFlag(c: CaseCore, flag: string, input: PlayerInput): CaseOutcome {
  const a = input.answer;
  const ok = (a?.text ?? '').trim() === flag;
  return taskOutcome(c, input, ok ? 1 : 0, a?.runs ?? 0);
}
