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

/** Koran pagi sebelum shift (ADR 020): berita, dampak shift kemarin, tips, iklan baris. */
export const newspaperSchema = z.strictObject({
  headline: text,
  lead: text,
  /** Berita dampak shift sebelumnya, menurut hasil pemain. Tidak ada di shift pertama. */
  impact: z.strictObject({ good: text, mixed: text, bad: text }).optional(),
  tip: z.strictObject({ title: text, text }),
  classified: text.optional(),
  sources: z.array(text).min(1),
});
export type Newspaper = z.infer<typeof newspaperSchema>;

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
  pay: z.strictObject({
    base: z.number().int().nonnegative(),
    perCase: z.number().int().nonnegative(),
  }),
  newspaper: newspaperSchema.optional(),
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

export const speakerSchema = z.enum(['rani', 'kelabu', 'joko', 'narrator']);
export const dialogueSchema = z.strictObject({
  id: idSchema,
  lines: z.array(z.strictObject({ speaker: speakerSchema, text })).min(1),
});
export const dialogueFileSchema = z.strictObject({ dialogues: z.array(dialogueSchema).min(1) });

export const toolSchema = z.strictObject({
  id: idSchema,
  name: text,
  icon: text,
  description: text,
  price: z.number().int().positive(),
  conceptId: idSchema,
  /** Muncul di toko mulai shift ini. */
  unlockAtShift: z.number().int().positive(),
});
export const toolsFileSchema = z.strictObject({ tools: z.array(toolSchema).min(1) });

/** Lencana (PRD C3, ADR 021). Aturannya dinilai oleh engine/badges.ts. */
const minCases = z.number().int().positive();
const minStars = z.literal([1, 2, 3]).optional();
export const badgeRuleSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('shift-complete'), shiftId: idSchema.optional() }),
  z.strictObject({ type: z.literal('shift-stars'), stars: z.literal([1, 2, 3]) }),
  z.strictObject({ type: z.literal('no-threat-allowed'), minCases, minStars }),
  z.strictObject({ type: z.literal('no-legit-blocked'), minCases, minStars }),
  z.strictObject({ type: z.literal('evidence-streak'), count: minCases }),
  z.strictObject({ type: z.literal('no-hints'), minCases, minStars }),
  z.strictObject({ type: z.literal('review-perfect') }),
  z.strictObject({ type: z.literal('tools-owned'), count: minCases }),
  z.strictObject({ type: z.literal('trust-at-least'), value: z.number().int().min(1).max(100) }),
]);
export const badgeSchema = z.strictObject({
  id: idSchema,
  title: text,
  description: text,
  icon: text,
  tier: z.enum(['bronze', 'silver', 'gold']),
  rule: badgeRuleSchema,
});
export const badgesFileSchema = z.strictObject({ badges: z.array(badgeSchema).min(1) });
export type Badge = z.infer<typeof badgeSchema>;

/** Tes awal/akhir (PRD §5.3): ID soal review, dua bentuk paralel yang tidak saling tumpang tindih. */
export const assessmentSchema = z.strictObject({
  pre: z.array(idSchema).min(3).max(10),
  post: z.array(idSchema).min(3).max(10),
});

/** Bagian kasus yang sama untuk semua tipe; `data` divalidasi oleh skema tipe kasus. */
export const baseCaseSchema = z.strictObject({
  id: idSchema,
  type: idSchema,
  conceptIds: z.array(idSchema).min(1),
  difficulty: level,
  verdict: z.enum(['safe', 'malicious', 'suspicious', 'no-fault', 'fault', 'specialist']),
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
  /** Petunjuk bertingkat dari mentor: umum → spesifik. Petunjuk ke-2 dst. memotong skor. */
  hints: z.array(text).min(1).max(3),
  /**
   * Data tambahan yang hanya terlihat dengan alat (Cek WHOIS, Sandbox). Bukti di sini boleh menjadi
   * `supporting`, tidak boleh `required`: kasus harus bisa diselesaikan tanpa alat.
   */
  intel: z
    .strictObject({
      whois: z
        .array(z.strictObject({ domain: text, registered: text, evidenceId: idSchema.optional() }))
        .optional(),
      sandbox: z.array(z.strictObject({ text, evidenceId: idSchema.optional() })).optional(),
    })
    .optional(),
});

/** Bagian dokumen yang bisa ditandai sebagai bukti. */
export const markableTextSchema = z.strictObject({ text, evidenceId: idSchema.optional() });

export type ModeMeta = z.infer<typeof modeMetaSchema>;
export type ConceptFrontmatter = z.infer<typeof conceptFrontmatterSchema>;
/** `html` = materi Markdown yang sudah di-render (konten tepercaya dari repo). */
export type Concept = ConceptFrontmatter & { body: string; html: string };
export type Rule = z.infer<typeof ruleSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type Rulebook = z.infer<typeof rulebookSchema>;
export type ShiftDef = z.infer<typeof shiftSchema>;
export type QueueEntry = ShiftDef['queue'][number];
export type ReviewItem = z.infer<typeof reviewItemSchema>;
export type Dialogue = z.infer<typeof dialogueSchema>;
export type BaseCase = z.infer<typeof baseCaseSchema>;
export type Tool = z.infer<typeof toolSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type MarkableText = z.infer<typeof markableTextSchema>;
