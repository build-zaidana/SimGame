import { parseModeContentOrThrow, type ModeContent } from '../../content/loader.ts';
import type { Locale } from '../../i18n/index.ts';
import { socCaseSchemas } from './caseTypes/schemas.ts';

/** Memuat konten SOC untuk satu bahasa; tiap bahasa adalah chunk terpisah (PRD C4). */
export async function loadSocContent(locale: Locale): Promise<ModeContent> {
  const { PREFIX, json, md } =
    locale === 'en' ? await import('./content-en.ts') : await import('./content-id.ts');
  const files: Record<string, unknown> = {};
  for (const [path, value] of Object.entries({ ...json, ...md }))
    files[path.slice(PREFIX.length)] = value;
  return parseModeContentOrThrow(files, socCaseSchemas);
}
