/**
 * Validator konten (ARCHITECTURE §5.6): skema zod, referensi silang, rasio kasus aman,
 * batas kata, merek nyata, dan domain. Dijalankan di CI lewat `pnpm content:check`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { checkModeContent, DEFAULT_LIMITS, type CheckPolicy } from '../src/content/checks.ts';
import { parseModeContent, type CaseSchemas, type ContentError } from '../src/content/loader.ts';
import { socCaseSchemas } from '../src/modes/soc/caseTypes/schemas.ts';

const ROOT = join(import.meta.dirname, '..');
const LOCALES_DIR = join(ROOT, 'content');

/** Skema tipe kasus per mode. Mode baru wajib didaftarkan di sini. */
const CASE_SCHEMAS: Record<string, CaseSchemas> = { soc: socCaseSchemas };

const brands = JSON.parse(readFileSync(join(ROOT, 'scripts/brand-denylist.json'), 'utf8')) as {
  terms: CheckPolicy['brandDenylist'];
  conceptAllowlist: string[];
};
const fictional = JSON.parse(
  readFileSync(join(ROOT, 'scripts/fictional-domains.json'), 'utf8'),
) as { domains: string[] };

const policy: CheckPolicy = {
  ...DEFAULT_LIMITS,
  brandDenylist: brands.terms,
  conceptBrandAllowlist: brands.conceptAllowlist,
  fictionalDomains: fictional.domains,
  knownGenerators: [],
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
    const schemas = CASE_SCHEMAS[modeId];
    if (!schemas) {
      errors.push({ file: prefix, message: 'mode belum terdaftar di CASE_SCHEMAS' });
      continue;
    }
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
    const all = [...parseErrors, ...checkModeContent(content, policy)];
    errors.push(...all.map((e) => ({ ...e, file: prefix + e.file })));
  }
}

if (errors.length > 0) {
  console.error(`content:check gagal (${errors.length}):`);
  for (const e of errors) console.error(`- ${e.file}: ${e.message}`);
  process.exit(1);
}
console.log(`content:check OK (${fileCount} file diperiksa)`);
