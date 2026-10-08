import { scoreDecision, scoreEvidence } from '../../engine/scoring.ts';
import type { CaseCore, CaseImpact, CaseOutcome, PlayerInput } from '../../engine/types.ts';

/**
 * Arti keputusan Meja Data (ADR 031), dipetakan ke dampak engine yang sama:
 * - menyetujui grafik menyesatkan / permintaan data berisiko → masalah ikut terbit (dampak terbesar),
 * - meminta revisi laporan yang jujur → pekerjaan baik tertahan,
 * - eskalasi laporan yang jujur → tim hukum/atasan repot tanpa perlu.
 */
function impactOf(c: CaseCore, decision: string, decisionScore: number): CaseImpact {
  if (decision === c.correctDecision) return 'correct';
  const problem = c.verdict !== 'no-fault';
  if (problem && decision === 'approve') return 'threat-allowed';
  if (!problem && decision === 'escalate') return 'needless-escalation';
  if (!problem) return 'legit-blocked';
  return decisionScore > 0 ? 'partial' : 'wrong';
}

/** Evaluasi kasus keputusan Meja Data (grafik & permintaan). Murni: tanpa React. */
export function evaluateDataCase(c: CaseCore, input: PlayerInput): CaseOutcome {
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

/** Efisiensi: 1–2 kali menjalankan query = penuh; tiap percobaan berikutnya −0,1 (min 0,5). */
function efficiency(runs: number): number {
  return Math.max(0.5, Math.min(1, 1 - (runs - 2) * 0.1));
}

/**
 * Tugas query (ADR 031): nilai = bagian set data (terlihat + tersembunyi) yang hasilnya sama dengan
 * query acuan; "bukti" diganti efisiensi (sedikit percobaan). Hasil dari worker sql.js.
 */
export function evaluateQueryCase(c: CaseCore, input: PlayerInput): CaseOutcome {
  const a = input.answer;
  const score = a?.total ? (a.passed ?? 0) / a.total : 0;
  const correct = score === 1;
  return {
    caseId: c.id,
    decision: input.decision,
    verdict: c.verdict,
    severity: c.severity,
    impact: correct ? 'correct' : score > 0 ? 'partial' : 'wrong',
    correct,
    decisionScore: score,
    evidenceScore: efficiency(a?.runs ?? 0),
    missedEvidence: [],
    wrongMarks: [],
  };
}
