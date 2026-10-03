/**
 * Skema zod konten (ARCHITECTURE §5). Dipakai oleh loader di browser dan oleh
 * `scripts/content-check.ts` di Node, jadi import memakai ekstensi `.ts` (ADR 010).
 */
import { z } from 'zod';

export const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'ID harus kebab-case');
const text = z.string().trim().min(1);
const level = z.literal([1, 2, 3]);

export const modeMetaSchema = z.strictObject({
  id: idSchema,
  title: text,
  description: text,
});

export const conceptFrontmatterSchema = z.strictObject({
  id: idSchema,
  title: text,
  mode: idSchema,
  order: z.number().int().positive(),
  sources: z.array(text).min(1),
});

export const ruleSchema = z.strictObject({
  id: idSchema,
  text,
  evidenceTags: z.array(idSchema).default([]),
});

export const chapterSchema = z.strictObject({
  id: idSchema,
  title: text,
  conceptId: idSchema,
  unlockAtShift: z.number().int().positive(),
  rules: z.array(ruleSchema).min(1),
});

export const rulebookSchema = z.strictObject({ chapters: z.array(chapterSchema).min(1) });

const caseQueueEntrySchema = z.strictObject({
  caseId: idSchema,
  arriveAt: z.number().nonnegative(),
});
const generatorQueueEntrySchema = z.strictObject({
  generator: idSchema,
  params: z.record(z.string(), z.unknown()),
  arriveAt: z.number().nonnegative(),
});

export const shiftSchema = z.strictObject({
  id: idSchema,
  order: z.number().int().positive(),
  title: text,
  durationGameMinutes: z.number().int().positive(),
  realSecondsPerGameMinute: z.number().positive(),
  unlocksChapters: z.array(idSchema),
  introDialogue: idSchema,
  outroDialogue: idSchema,
  tutorial: z.boolean(),
  queue: z.array(z.union([caseQueueEntrySchema, generatorQueueEntrySchema])).min(1),
  review: z.strictObject({
    count: z.number().int().min(3).max(5),
    conceptIds: z.array(idSchema).min(1),
  }),
  pay: z.strictObject({ base: z.number().int().nonnegative(), perCorrect: z.number().int() }),
});

const reviewBase = {
  id: idSchema,
  conceptId: idSchema,
  difficulty: level,
  prompt: text,
  explanation: text,
};

export const mcqSchema = z.strictObject({
  ...reviewBase,
  type: z.literal('mcq'),
  choices: z.array(text).min(2).max(4),
  answerIndex: z.number().int().nonnegative(),
});

export const tapEvidenceSchema = z.strictObject({
  ...reviewBase,
  type: z.literal('tap-evidence'),
  parts: z.array(z.strictObject({ text, evidenceId: idSchema.optional() })).min(1),
  answer: z.array(idSchema).min(1),
});

export const orderStepsSchema = z.strictObject({
  ...reviewBase,
  type: z.literal('order-steps'),
  /** Langkah dalam urutan yang benar; UI mengacaknya. */
  steps: z.array(text).min(2).max(6),
});

export const reviewItemSchema = z.discriminatedUnion('type', [
  mcqSchema,
  tapEvidenceSchema,
  orderStepsSchema,
]);
export const reviewFileSchema = z.strictObject({ items: z.array(reviewItemSchema).min(1) });

export const speakerSchema = z.enum(['rani', 'kelabu', 'narrator']);
export const dialogueSchema = z.strictObject({
  id: idSchema,
  lines: z.array(z.strictObject({ speaker: speakerSchema, text })).min(1),
});
export const dialogueFileSchema = z.strictObject({ dialogues: z.array(dialogueSchema).min(1) });

/** Bagian kasus yang sama untuk semua tipe; `data` divalidasi oleh skema tipe kasus. */
export const baseCaseSchema = z.strictObject({
  id: idSchema,
  type: idSchema,
  conceptIds: z.array(idSchema).min(1),
  difficulty: level,
  verdict: z.enum(['safe', 'malicious', 'suspicious']),
  correctDecision: idSchema,
  acceptableDecisions: z.record(idSchema, z.number().min(0).max(1)).default({}),
  severity: level,
  data: z.unknown(),
  evidence: z.strictObject({
    required: z.array(idSchema),
    supporting: z.array(idSchema).default([]),
  }),
  explanation: text,
  ruleRefs: z.array(idSchema).min(1),
});

/** Bagian dokumen yang bisa ditandai sebagai bukti. */
export const markableTextSchema = z.strictObject({ text, evidenceId: idSchema.optional() });

export type ModeMeta = z.infer<typeof modeMetaSchema>;
export type ConceptFrontmatter = z.infer<typeof conceptFrontmatterSchema>;
export type Concept = ConceptFrontmatter & { body: string };
export type Rule = z.infer<typeof ruleSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Rulebook = z.infer<typeof rulebookSchema>;
export type ShiftDef = z.infer<typeof shiftSchema>;
export type QueueEntry = ShiftDef['queue'][number];
export type ReviewItem = z.infer<typeof reviewItemSchema>;
export type Dialogue = z.infer<typeof dialogueSchema>;
export type BaseCase = z.infer<typeof baseCaseSchema>;
export type MarkableText = z.infer<typeof markableTextSchema>;
