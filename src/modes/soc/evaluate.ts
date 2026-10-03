import { scoreDecision, scoreEvidence } from '../../engine/scoring.ts';
import type { CaseCore, CaseImpact, CaseOutcome, PlayerInput } from '../../engine/types.ts';

/** Arti keputusan SOC bagi klien: izinkan ancaman, blokir yang sah, atau eskalasi tak perlu. */
function impactOf(c: CaseCore, decision: string, decisionScore: number): CaseImpact {
  if (decision === c.correctDecision) return 'correct';
  if (c.verdict !== 'safe' && decision === 'allow') return 'threat-allowed';
  if (c.verdict === 'safe' && decision === 'block') return 'legit-blocked';
  if (c.verdict === 'safe' && decision === 'escalate') return 'needless-escalation';
  return decisionScore > 0 ? 'partial' : 'wrong';
}

/** Evaluasi bersama semua tipe kasus SOC. Murni: tanpa React. */
export function evaluateSocCase(c: CaseCore, input: PlayerInput): CaseOutcome {
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
