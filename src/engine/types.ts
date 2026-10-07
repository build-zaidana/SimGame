import type { RngState } from './rng.ts';

/** Keputusan pemain; tiap mode mendefinisikan daftarnya sendiri. */
export type DecisionId = string;
export type EvidenceId = string;
/**
 * Verdict kasus. SOC: aman / berbahaya / mencurigakan. IT Support (ADR 025): tidak ada kerusakan
 * (cukup diarahkan) / ada kerusakan / perlu spesialis. `safe` dan `no-fault` dihitung sebagai
 * kasus "tidak perlu tindakan" (rasio 30–40% per shift). `task` (ADR 026): tugas coding/CTF di
 * Meja Developer; bukan keputusan aman/tidak, jadi tidak ikut dihitung dalam rasio itu.
 */
export type Verdict =
  'safe' | 'malicious' | 'suspicious' | 'no-fault' | 'fault' | 'specialist' | 'task';
export const NO_ACTION_VERDICTS: readonly Verdict[] = ['safe', 'no-fault'];
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

/**
 * Jawaban yang diketik pemain (kode Python atau bendera CTF, ADR 026). `passed`/`total` = hasil
 * tes terakhir untuk teks ini; hilang begitu teks diubah. `runs` = berapa kali tes dijalankan.
 */
export interface CaseAnswer {
  text: string;
  runs: number;
  passed?: number | undefined;
  total?: number | undefined;
  /** Waktu (ms jam shift) rollback darurat pada insiden produksi; menghentikan kerusakan. */
  rolledBackAtMs?: number | undefined;
}

export interface PlayerInput {
  decision: DecisionId;
  marks: EvidenceId[];
  answer?: CaseAnswer | undefined;
  /** Waktu jam shift saat kasus dibuka & saat diputuskan (untuk insiden yang memburuk seiring waktu). */
  /** `relaxed`: mode Santai, jam tidak boleh mengurangi skor (PRD §76). */
  timing?: { openedAtMs: number; nowMs: number; relaxed?: boolean } | undefined;
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
  /** Gelombang boss akhir shift (ADR 028): kasus-kasus ini datang bersamaan di `arriveAt`. */
  boss?: BossPlan | undefined;
}

export interface BossPlan {
  caseIds: string[];
  /** Menit game saat boss datang. */
  arriveAt: number;
  /** Batas waktu boss (menit game, hanya di mode Normal). */
  durationGameMinutes: number;
  /** Bonus gaji bila semua kasus boss benar. */
  reward: number;
}

export interface SessionBoss {
  caseIds: string[];
  startsAtMs: number;
  endsAtMs: number;
  reward: number;
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
  /** v9: jawaban ketikan pemain (Meja Developer). */
  answer?: CaseAnswer | undefined;
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
  /** Keuntungan meja & pangkat saat shift dimulai (ADR 027). Tidak ada = nilai bawaan. */
  perks?: SessionPerks | undefined;
  /** v12: gelombang boss shift ini (ADR 028). Tidak ada = shift tanpa boss. */
  boss?: SessionBoss | undefined;
  /** v13: sesi tantangan harian (ADR 029); engine tidak membacanya. */
  daily?: { date: string } | undefined;
}

export interface SessionPerks {
  /** Banyak petunjuk per kasus yang tidak mengurangi skor (bawaan 1). */
  freeHints: number;
  /** Tunjangan pangkat yang ditambahkan ke gaji shift. */
  payBonus: number;
  /** Tambahan durasi shift dalam persen (sudah dihitung ke durationMs). */
  shiftTimePercent: number;
}
