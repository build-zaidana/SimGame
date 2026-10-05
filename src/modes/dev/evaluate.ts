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
