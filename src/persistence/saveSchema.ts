import { z } from 'zod';
import type { ShiftSession } from '../engine/types.ts';

/** Naikkan + tambah migrasi di migrations.ts + test setiap kali bentuk save berubah. */
export const SAVE_SCHEMA_VERSION = 1;

const level = z.literal([1, 2, 3]);
const score01 = z.number().min(0).max(1);

const caseOutcomeSchema = z.object({
  caseId: z.string(),
  decision: z.string(),
  verdict: z.enum(['safe', 'malicious', 'suspicious']),
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
});

export const settingsSchema = z.object({
  textScale: z.literal([1, 1.15, 1.3]),
  playMode: z.enum(['relaxed', 'normal']),
  reduceMotion: z.boolean(),
  sound: z.boolean(),
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
  chaptersUnlocked: z.array(z.string()),
  /** Untuk melanjutkan di tengah shift. */
  activeSession: shiftSessionSchema.optional(),
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
  assessments: z
    .object({ pre: assessmentResultSchema.optional(), post: assessmentResultSchema.optional() })
    .optional(),
  /** Dialog yang sudah dilihat, tutorial, pengingat ekspor. */
  flags: z.record(z.string(), z.boolean()),
});

export type SaveData = z.infer<typeof saveDataSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type ModeProgress = z.infer<typeof modeProgressSchema>;

export const INITIAL_TRUST = 75;

export function createNewSave({ installId, now }: { installId: string; now: string }): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    installId,
    profile: {
      nickname: '',
      settings: { textScale: 1, playMode: 'relaxed', reduceMotion: false, sound: true },
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
    chaptersUnlocked: [],
  };
}
