/**
 * Validator konten (ARCHITECTURE §5.6): skema zod, referensi silang, rasio kasus aman,
 * batas kata, merek nyata, dan domain. Dijalankan di CI lewat `pnpm content:check`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { checkModeContent, DEFAULT_LIMITS, type CheckPolicy } from '../src/content/checks.ts';
import { parseModeContent, type CaseSchemas, type ContentError } from '../src/content/loader.ts';
import { checkLocaleParity, type Renames } from '../src/content/parity.ts';
import { createRng } from '../src/engine/rng.ts';
import type { CaseGenerator } from '../src/modes/contract.ts';
import { socCaseSchemas } from '../src/modes/soc/caseTypes/schemas.ts';
import { socGenerators } from '../src/modes/soc/generators/index.ts';
import { SOC_TOOL_IDS } from '../src/modes/soc/tools.ts';
import { supportCaseSchemas } from '../src/modes/support/caseTypes/schemas.ts';
import { SUPPORT_TOOL_IDS } from '../src/modes/support/tools.ts';

const ROOT = join(import.meta.dirname, '..');
const LOCALES_DIR = join(ROOT, 'content');

/** Registri per mode (skema tipe kasus, generator, alat). Mode baru wajib didaftarkan di sini. */
const MODES: Record<
  string,
  { schemas: CaseSchemas; generators: Record<string, CaseGenerator>; tools: string[] }
> = {
  soc: { schemas: socCaseSchemas, generators: socGenerators, tools: SOC_TOOL_IDS },
  support: { schemas: supportCaseSchemas, generators: {}, tools: SUPPORT_TOOL_IDS },
};
/** Jumlah seed yang dicoba untuk tiap entri generator di antrian shift. */
const GENERATOR_SAMPLES = 20;

const brands = JSON.parse(readFileSync(join(ROOT, 'scripts/brand-denylist.json'), 'utf8')) as {
  terms: CheckPolicy['brandDenylist'];
  conceptAllowlist: string[];
};
const fictional = JSON.parse(
  readFileSync(join(ROOT, 'scripts/fictional-domains.json'), 'utf8'),
) as { domains: string[] };

const basePolicy: Omit<CheckPolicy, 'knownGenerators' | 'knownTools'> = {
  ...DEFAULT_LIMITS,
  brandDenylist: brands.terms,
  conceptBrandAllowlist: brands.conceptAllowlist,
  fictionalDomains: fictional.domains,
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function readModeFiles(modeDir: string, errors: ContentError[]): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  for (const path of walk(modeDir)) {
    const rel = relative(modeDir, path).split(sep).join('/');
    const raw = readFileSync(path, 'utf8');
    if (path.endsWith('.json')) {
      try {
        files[rel] = JSON.parse(raw);
      } catch (e) {
        errors.push({ file: rel, message: `JSON tidak valid: ${(e as Error).message}` });
      }
    } else {
      files[rel] = raw;
    }
  }
  return files;
}

const errors: ContentError[] = [];
let fileCount = 0;
for (const locale of readdirSync(LOCALES_DIR)) {
  const modesDir = join(LOCALES_DIR, locale, 'modes');
  if (!existsSync(modesDir)) continue;
  for (const modeId of readdirSync(modesDir)) {
    const prefix = `${locale}/modes/${modeId}/`;
    const registry = MODES[modeId];
    if (!registry) {
      errors.push({ file: prefix, message: 'mode belum terdaftar di MODES' });
      continue;
    }
    const { schemas, generators, tools } = registry;
    const readErrors: ContentError[] = [];
    const files = readModeFiles(join(modesDir, modeId), readErrors);
    fileCount += Object.keys(files).length;
    const { content, errors: parseErrors } = parseModeContent(files, schemas);
    parseErrors.unshift(...readErrors);
    if (content.meta.id && content.meta.id !== modeId) {
      parseErrors.push({
        file: 'mode.json',
        message: `id "${content.meta.id}" ≠ folder "${modeId}"`,
      });
    }
    // Kasus prosedural: jalankan generator dengan banyak seed dan periksa hasilnya seperti kasus biasa.
    for (const shift of content.shifts) {
      shift.queue.forEach((q, i) => {
        if (!('generator' in q)) return;
        const generate = generators[q.generator];
        if (!generate) return; // dilaporkan checkModeContent
        for (let seed = 0; seed < GENERATOR_SAMPLES; seed++) {
          const id = `gen-${shift.id}-${i}-${seed}`;
          try {
            const [raw] = generate(q.params, createRng(seed), { id });
            const parsed = schemas[raw.type]?.safeParse(raw);
            if (!parsed?.success) {
              parseErrors.push({
                file: `shifts/${shift.id}.json`,
                message: `${q.generator} (seed ${seed}) menghasilkan kasus tidak valid`,
              });
              return;
            }
            content.cases[id] = parsed.data;
          } catch (e) {
            parseErrors.push({
              file: `shifts/${shift.id}.json`,
              message: `${q.generator}: params tidak valid (${(e as Error).message.slice(0, 120)})`,
            });
            return;
          }
        }
      });
    }
    const policy: CheckPolicy = {
      ...basePolicy,
      knownGenerators: Object.keys(generators),
      knownTools: tools,
    };
    const all = [...parseErrors, ...checkModeContent(content, policy)];
    errors.push(...all.map((e) => ({ ...e, file: prefix + e.file })));
  }
}

// Paritas antarbahasa (ADR 023): setiap bahasa punya file yang sama dengan bahasa dasar, dan
// terjemahan hanya mengubah teks manusia, bukan jawaban, ID bukti, atau alamat.
const BASE_LOCALE = 'id';
const frontmatterKeys = (md: string) =>
  (/^---\n([\s\S]*?)\n---/.exec(md)?.[1] ?? '')
    .split('\n')
    .filter((l) => /^(id|mode|order):/.test(l))
    .join('\n');
for (const locale of readdirSync(LOCALES_DIR)) {
  if (locale === BASE_LOCALE) continue;
  const modesDir = join(LOCALES_DIR, locale, 'modes');
  if (!existsSync(modesDir)) continue;
  const renamesFile = join(LOCALES_DIR, locale, 'renames.json');
  const renames: Renames = existsSync(renamesFile)
    ? (JSON.parse(readFileSync(renamesFile, 'utf8')) as { renames: [string, string][] }).renames
    : [];
  for (const modeId of readdirSync(modesDir)) {
    const baseDir = join(LOCALES_DIR, BASE_LOCALE, 'modes', modeId);
    const dir = join(modesDir, modeId);
    const base = readModeFiles(baseDir, []);
    const other = readModeFiles(dir, []);
    const prefix = `${locale}/modes/${modeId}/`;
    for (const rel of Object.keys(base))
      if (!(rel in other)) errors.push({ file: prefix + rel, message: 'terjemahan belum ada' });
    for (const rel of Object.keys(other)) {
      if (!(rel in base)) {
        errors.push({ file: prefix + rel, message: `tidak ada di bahasa dasar (${BASE_LOCALE})` });
        continue;
      }
      const diffs = rel.endsWith('.md')
        ? frontmatterKeys(base[rel] as string) === frontmatterKeys(other[rel] as string)
          ? []
          : ['frontmatter id/mode/order berbeda']
        : checkLocaleParity(base[rel], other[rel], renames);
      for (const d of diffs.slice(0, 5))
        errors.push({ file: prefix + rel, message: `paritas dengan ${BASE_LOCALE}: ${d}` });
    }
  }
}

if (errors.length > 0) {
  console.error(`content:check gagal (${errors.length}):`);
  for (const e of errors) console.error(`- ${e.file}: ${e.message}`);
  process.exit(1);
}
console.log(`content:check OK (${fileCount} file diperiksa)`);
