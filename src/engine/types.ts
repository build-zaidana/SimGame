import type { RngState } from './rng.ts';

/** Keputusan pemain; tiap mode mendefinisikan daftarnya sendiri. */
export type DecisionId = string;
export type EvidenceId = string;
export type Verdict = 'safe' | 'malicious' | 'suspicious';
export type PlayMode = 'relaxed' | 'normal';
export type Severity = 1 | 2 | 3;

/**
 * Dampak keputusan bagi klien. Dihitung oleh `evaluate()` milik mode (karena hanya mode yang tahu
 * arti "izinkan" atau "blokir"); engine hanya memetakan dampak ke Kepercayaan.
 */
export type CaseImpact =
  'correct' | 'threat-allowed' | 'legit-blocked' | 'needless-escalation' | 'partial' | 'wrong';

/** Bagian kasus yang dipakai untuk penilaian, tanpa isi dokumen. */
export interface CaseCore {
  id: string;
  verdict: Verdict;
  correctDecision: DecisionId;
  acceptableDecisions: Record<DecisionId, number>;
  severity: Severity;
  evidence: { required: EvidenceId[]; supporting: EvidenceId[] };
}

export interface PlayerInput {
  decision: DecisionId;
  marks: EvidenceId[];
}

export interface CaseOutcome {
  caseId: string;
  decision: DecisionId;
  verdict: Verdict;
  severity: Severity;
  impact: CaseImpact;
  /** true jika keputusan == correctDecision. */
  correct: boolean;
  decisionScore: number;
  evidenceScore: number;
  missedEvidence: EvidenceId[];
  wrongMarks: EvidenceId[];
}

/** Rencana shift yang sudah di-resolve dari konten (engine tidak membaca file). */
export interface ShiftPlan {
  shiftId: string;
  modeId: string;
  order: number;
  durationGameMinutes: number;
  realSecondsPerGameMinute: number;
  cases: { caseId: string; arriveAt: number }[];
}

export type ShiftPhase = 'briefing' | 'working' | 'inspecting' | 'feedback' | 'ended';
export type SessionCaseStatus = 'pending' | 'arrived' | 'decided' | 'missed';

export interface SessionCase {
  caseId: string;
  arriveAtMs: number;
  status: SessionCaseStatus;
  marks: EvidenceId[];
  hintsUsed: number;
  openedAtMs: number | null;
  outcome: CaseOutcome | null;
  score: number | null;
}

/** Seluruh state shift. Data biasa: bisa diserialisasi dan dilanjutkan. */
export interface ShiftSession {
  shiftId: string;
  modeId: string;
  shiftOrder: number;
  playMode: PlayMode;
  seed: number;
  rng: RngState;
  phase: ShiftPhase;
  paused: boolean;
  elapsedMs: number;
  durationMs: number;
  msPerGameMinute: number;
  cases: SessionCase[];
  activeCaseId: string | null;
  feedbackCaseId: string | null;
  trust: number;
  /**
   * Data kasus prosedural (generator) yang dibuat saat shift dimulai. Engine tidak membacanya;
   * disimpan di sini supaya shift yang dilanjutkan memakai kasus yang sama persis.
   */
  generatedCases: Record<string, unknown>;
}
