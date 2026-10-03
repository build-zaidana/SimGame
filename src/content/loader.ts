/**
 * Mengubah peta file mentah satu mode menjadi konten tervalidasi.
 * Kunci peta = path relatif terhadap folder mode (mis. `cases/s01-email-001.json`);
 * nilai = objek JSON hasil parse, atau string untuk file `.md`.
 */
import { marked } from 'marked';
import { parse as parseYaml } from 'yaml';
import type { z } from 'zod';
import {
  assessmentSchema,
  baseCaseSchema,
  conceptFrontmatterSchema,
  dialogueFileSchema,
  modeMetaSchema,
  reviewFileSchema,
  rulebookSchema,
  shiftSchema,
  toolsFileSchema,
  badgesFileSchema,
  type Badge,
  type Assessment,
  type BaseCase,
  type Concept,
  type Dialogue,
  type ModeMeta,
  type ReviewItem,
  type Rulebook,
  type ShiftDef,
  type Tool,
} from './schemas.ts';

export type CaseSchemas = Record<string, z.ZodType<BaseCase, unknown>>;

export interface ModeContent<TCase extends BaseCase = BaseCase> {
  meta: ModeMeta;
  concepts: Concept[];
  rulebook: Rulebook;
  shifts: ShiftDef[];
  cases: Record<string, TCase>;
  review: ReviewItem[];
  dialogues: Record<string, Dialogue>;
  tools: Tool[];
  badges: Badge[];
  assessment: Assessment | null;
}

export interface ContentError {
  file: string;
  message: string;
}

export interface ParseResult<TCase extends BaseCase = BaseCase> {
  content: ModeContent<TCase>;
  errors: ContentError[];
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function issues(file: string, error: z.ZodError): ContentError[] {
  return error.issues.map((i) => ({
    file,
    message: `${i.path.length > 0 ? i.path.join('.') + ': ' : ''}${i.message}`,
  }));
}

const baseName = (path: string) => path.replace(/^.*\//, '').replace(/\.(json|md)$/, '');

export function parseModeContent<TCase extends BaseCase = BaseCase>(
  files: Readonly<Record<string, unknown>>,
  caseSchemas: CaseSchemas,
): ParseResult<TCase> {
  const errors: ContentError[] = [];
  const content: ModeContent<TCase> = {
    meta: { id: '', title: '', description: '' },
    concepts: [],
    rulebook: { chapters: [] },
    shifts: [],
    cases: {},
    review: [],
    dialogues: {},
    tools: [],
    badges: [],
    assessment: null,
  };

  const parse = <T>(file: string, schema: z.ZodType<T, unknown>, raw: unknown): T | null => {
    const r = schema.safeParse(raw);
    if (r.success) return r.data;
    errors.push(...issues(file, r.error));
    return null;
  };
  const requireIdMatchesFile = (file: string, id: string) => {
    if (id !== baseName(file))
      errors.push({ file, message: `id "${id}" harus sama dengan nama file` });
  };

  for (const [file, raw] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    if (file === 'mode.json') {
      content.meta = parse(file, modeMetaSchema, raw) ?? content.meta;
    } else if (file === 'tools.json') {
      content.tools = parse(file, toolsFileSchema, raw)?.tools ?? [];
    } else if (file === 'badges.json') {
      content.badges = parse(file, badgesFileSchema, raw)?.badges ?? [];
    } else if (file === 'assessment.json') {
      content.assessment = parse(file, assessmentSchema, raw);
    } else if (file === 'rulebook.json') {
      content.rulebook = parse(file, rulebookSchema, raw) ?? content.rulebook;
    } else if (file.startsWith('concepts/') && file.endsWith('.md')) {
      const m = typeof raw === 'string' ? FRONTMATTER.exec(raw) : null;
      if (!m) {
        errors.push({ file, message: 'frontmatter YAML (--- … ---) tidak ditemukan' });
        continue;
      }
      let fm: unknown;
      try {
        fm = parseYaml(m[1] ?? '');
      } catch (e) {
        errors.push({ file, message: `frontmatter bukan YAML valid: ${(e as Error).message}` });
        continue;
      }
      const meta = parse(file, conceptFrontmatterSchema, fm);
      if (meta) {
        requireIdMatchesFile(file, meta.id);
        const body = (m[2] ?? '').trim();
        content.concepts.push({ ...meta, body, html: marked.parse(body, { async: false }) });
      }
    } else if (file.startsWith('shifts/') && file.endsWith('.json')) {
      const shift = parse(file, shiftSchema, raw);
      if (shift) content.shifts.push(shift);
    } else if (file.startsWith('cases/') && file.endsWith('.json')) {
      const type = (raw as { type?: unknown } | null)?.type;
      const schema = typeof type === 'string' ? caseSchemas[type] : undefined;
      if (!schema) {
        errors.push({ file, message: `tipe kasus tidak dikenal: ${String(type)}` });
        parse(file, baseCaseSchema, raw);
        continue;
      }
      const c = parse(file, schema, raw) as TCase | null;
      if (!c) continue;
      requireIdMatchesFile(file, c.id);
      if (content.cases[c.id]) errors.push({ file, message: `ID kasus duplikat: ${c.id}` });
      content.cases[c.id] = c;
    } else if (file.startsWith('review/') && file.endsWith('.json')) {
      content.review.push(...(parse(file, reviewFileSchema, raw)?.items ?? []));
    } else if (file.startsWith('dialogue/') && file.endsWith('.json')) {
      for (const d of parse(file, dialogueFileSchema, raw)?.dialogues ?? []) {
        if (content.dialogues[d.id]) errors.push({ file, message: `ID dialog duplikat: ${d.id}` });
        content.dialogues[d.id] = d;
      }
    } else {
      errors.push({ file, message: 'file tidak dikenali di folder mode' });
    }
  }

  if (!files['mode.json']) errors.push({ file: 'mode.json', message: 'file wajib tidak ada' });
  if (!files['rulebook.json'])
    errors.push({ file: 'rulebook.json', message: 'file wajib tidak ada' });
  content.concepts.sort((a, b) => a.order - b.order);
  content.shifts.sort((a, b) => a.order - b.order);
  return { content, errors };
}

export function parseModeContentOrThrow<TCase extends BaseCase = BaseCase>(
  files: Readonly<Record<string, unknown>>,
  caseSchemas: CaseSchemas,
): ModeContent<TCase> {
  const { content, errors } = parseModeContent<TCase>(files, caseSchemas);
  if (errors.length > 0) {
    throw new Error(
      `Konten tidak valid:\n${errors.map((e) => `${e.file}: ${e.message}`).join('\n')}`,
    );
  }
  return content;
}
