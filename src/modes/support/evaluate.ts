import { scoreDecision, scoreEvidence } from '../../engine/scoring.ts';
import type { CaseCore, CaseImpact, CaseOutcome, PlayerInput } from '../../engine/types.ts';

/**
 * Arti keputusan Bengkel IT bagi pengguna (ADR 025), dipetakan ke dampak engine yang sama:
 * - kerusakan nyata hanya "diarahkan" ke pengguna → masalah dibiarkan (dampak terbesar),
 * - memperbaiki/mengganti padahal tidak rusak → waktu & komponen terbuang,
 * - eskalasi tiket yang tidak rusak → spesialis repot tanpa perlu.
 */
function impactOf(c: CaseCore, decision: string, decisionScore: number): CaseImpact {
  if (decision === c.correctDecision) return 'correct';
  const broken = c.verdict !== 'no-fault';
  if (broken && decision === 'guide') return 'threat-allowed';
  if (!broken && decision === 'escalate') return 'needless-escalation';
  if (!broken) return 'legit-blocked';
  return decisionScore > 0 ? 'partial' : 'wrong';
}

/** Evaluasi bersama semua tipe kasus Bengkel IT. Murni: tanpa React. */
export function evaluateSupportCase(c: CaseCore, input: PlayerInput): CaseOutcome {
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
