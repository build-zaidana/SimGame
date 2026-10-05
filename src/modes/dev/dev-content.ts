import { parseModeContentOrThrow, type ModeContent } from '../../content/loader.ts';
import type { Locale } from '../../i18n/index.ts';
import { devCaseSchemas } from './caseTypes/schemas.ts';

/** Memuat konten Meja Developer untuk satu bahasa; tiap bahasa adalah chunk terpisah (PRD C4). */
export async function loadDevContent(locale: Locale): Promise<ModeContent> {
  const { PREFIX, json, md } =
    locale === 'en' ? await import('./dev-data-en.ts') : await import('./dev-data-id.ts');
  const files: Record<string, unknown> = {};
  for (const [path, value] of Object.entries({ ...json, ...md }))
    files[path.slice(PREFIX.length)] = value;
  return parseModeContentOrThrow(files, devCaseSchemas);
}
