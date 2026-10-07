import { z } from 'zod';
import type { ShiftSession } from '../engine/types.ts';
import { BASELINE_TRUST } from '../engine/economy.ts';
import { MAX_ANSWER_LENGTH } from '../engine/shift.ts';

/** Naikkan + tambah migrasi di migrations.ts + test setiap kali bentuk save berubah. */
export const SAVE_SCHEMA_VERSION = 14;

const level = z.literal([1, 2, 3]);
const score01 = z.number().min(0).max(1);

const caseOutcomeSchema = z.object({
  caseId: z.string(),
  decision: z.string(),
  verdict: z.enum(['safe', 'malicious', 'suspicious', 'no-fault', 'fault', 'specialist', 'task']),
  severity: level,
  impact: z.enum([
    'correct',
    'threat-allowed',
    'legit-blocked',
    'needless-escalation',
    'partial',
    'wrong',
  ]),
  correct: z.boolean(),
  decisionScore: score01,
  evidenceScore: score01,
  missedEvidence: z.array(z.string()),
  wrongMarks: z.array(z.string()),
});

const sessionCaseSchema = z.object({
  caseId: z.string(),
  arriveAtMs: z.number().nonnegative(),
  status: z.enum(['pending', 'arrived', 'decided', 'missed']),
  marks: z.array(z.string()),
  hintsUsed: z.number().int().nonnegative(),
  openedAtMs: z.number().nonnegative().nullable(),
  outcome: caseOutcomeSchema.nullable(),
  score: z.number().min(0).max(100).nullable(),
  /** v9: jawaban ketikan pemain (Meja Developer, ADR 026). */
  answer: z
    .object({
      text: z.string().max(MAX_ANSWER_LENGTH),
      runs: z.number().int().nonnegative(),
      passed: z.number().int().nonnegative().optional(),
      total: z.number().int().nonnegative().optional(),
      /** v10: rollback darurat pada insiden produksi. */
      rolledBackAtMs: z.number().nonnegative().optional(),
    })
    .optional(),
  /** v14: urutan keputusan dalam shift (kasus bisa dibuka bergantian). */
  decidedSeq: z.number().int().positive().optional(),
});

export const shiftSessionSchema: z.ZodType<ShiftSession> = z.object({
  shiftId: z.string(),
  modeId: z.string(),
  shiftOrder: z.number().int().positive(),
  playMode: z.enum(['relaxed', 'normal']),
  seed: z.number().int(),
  rng: z.object({ a: z.number().int().nonnegative() }),
  phase: z.enum(['briefing', 'working', 'inspecting', 'feedback', 'ended']),
  paused: z.boolean(),
  elapsedMs: z.number().nonnegative(),
  durationMs: z.number().positive(),
  msPerGameMinute: z.number().positive(),
  cases: z.array(sessionCaseSchema),
  activeCaseId: z.string().nullable(),
  feedbackCaseId: z.string().nullable(),
  trust: z.number().min(0).max(100),
  /** v2: kasus prosedural; divalidasi skema tipe kasus saat dipakai. */
  generatedCases: z.record(z.string(), z.unknown()),
  /** v11: keuntungan meja & pangkat saat shift dimulai (ADR 027). */
  perks: z
    .object({
      freeHints: z.number().int().min(1),
      payBonus: z.number().int().nonnegative(),
      shiftTimePercent: z.number().nonnegative(),
    })
    .optional(),
  /** v12: gelombang boss akhir shift (ADR 028). */
  boss: z
    .object({
      caseIds: z.array(z.string()).min(1),
      startsAtMs: z.number().nonnegative(),
      endsAtMs: z.number().nonnegative(),
      reward: z.number().int().nonnegative(),
    })
    .optional(),
  /** v13: tantangan harian (ADR 029). */
  daily: z.object({ date: z.string() }).optional(),
});

export const settingsSchema = z.object({
  textScale: z.literal([1, 1.15, 1.3]),
  playMode: z.enum(['relaxed', 'normal']),
  reduceMotion: z.boolean(),
  sound: z.boolean(),
  /** v5: musik latar (PRD C2), terpisah dari efek suara. */
  music: z.boolean(),
  /** v6: bahasa antarmuka & konten (PRD C4). */
  language: z.enum(['id', 'en']),
  /** v7: kantor top-down yang bisa dijelajahi (PRD C1); mati = ilustrasi statis. */
  exploreOffice: z.boolean(),
});

export const modeProgressSchema = z.object({
  unlockedShift: z.number().int().positive(),
  shifts: z.record(
    z.string(),
    z.object({
      bestScore: z.number().min(0).max(100),
      stars: z.literal([0, 1, 2, 3]),
      completedAt: z.string().optional(),
    }),
  ),
  wallet: z.number().int().nonnegative(),
  trust: z.number().min(0).max(100),
  toolsOwned: z.array(z.string()),
  /** v11: upgrade meja yang sudah dibeli (ADR 027). */
  upgradesOwned: z.array(z.string()),
  chaptersUnlocked: z.array(z.string()),
  /**
   * Untuk melanjutkan di tengah shift. Sesi yang rusak dibuang (`catch`), bukan menggagalkan seluruh
   * save: kehilangan satu shift yang sedang berjalan jauh lebih ringan daripada kehilangan progres.
   */
  activeSession: shiftSessionSchema.optional().catch(undefined),
  /** v3: shift Mode Latihan yang sedang berjalan (PRD S5); tidak memengaruhi progres utama. */
  practiceSession: shiftSessionSchema.optional().catch(undefined),
  /** v4: lencana yang sudah didapat → waktu didapat (ISO). */
  badges: z.record(z.string(), z.string()),
});

const assessmentResultSchema = z.object({
  correct: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  takenAt: z.string(),
});

export const saveDataSchema = z.object({
  schemaVersion: z.literal(SAVE_SCHEMA_VERSION),
  createdAt: z.string(),
  updatedAt: z.string(),
  /** UUID acak; tidak terkait identitas pemain. */
  installId: z.uuid(),
  profile: z.object({ nickname: z.string().max(24), settings: settingsSchema }),
  modes: z.record(z.string(), modeProgressSchema),
  mastery: z.record(
    z.string(),
    z.object({
      box: level,
      dueAtShiftIndex: z.number().int(),
      seen: z.number().int().nonnegative(),
      correct: z.number().int().nonnegative(),
    }),
  ),
  /** v13: tantangan harian (ADR 029): streak global + tanggal terakhir per mode. */
  daily: z
    .object({
      streak: z.number().int().nonnegative(),
      best: z.number().int().nonnegative(),
      lastDate: z.string().optional(),
      done: z.record(z.string(), z.string()),
    })
    .optional(),
  assessments: z
    .object({ pre: assessmentResultSchema.optional(), post: assessmentResultSchema.optional() })
    .optional(),
  /** Dialog yang sudah dilihat, tutorial, pengingat ekspor. */
  flags: z.record(z.string(), z.boolean()),
});

export type SaveData = z.infer<typeof saveDataSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type ModeProgress = z.infer<typeof modeProgressSchema>;

export const INITIAL_TRUST = BASELINE_TRUST;

export function createNewSave({ installId, now }: { installId: string; now: string }): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    installId,
    profile: {
      nickname: '',
      settings: {
        textScale: 1,
        playMode: 'relaxed',
        reduceMotion: false,
        sound: true,
        music: true,
        language: 'id',
        exploreOffice: true,
      },
    },
    modes: {},
    mastery: {},
    flags: {},
  };
}

export function newModeProgress(): ModeProgress {
  return {
    unlockedShift: 1,
    shifts: {},
    wallet: 0,
    trust: INITIAL_TRUST,
    toolsOwned: [],
    upgradesOwned: [],
    chaptersUnlocked: [],
    badges: {},
  };
}
