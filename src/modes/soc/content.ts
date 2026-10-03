import { parseModeContentOrThrow, type ModeContent } from '../../content/loader.ts';
import { socCaseSchemas } from './caseTypes/schemas.ts';

const PREFIX = '/content/id/modes/soc/';
const json = import.meta.glob<unknown>('/content/id/modes/soc/**/*.json', {
  eager: true,
  import: 'default',
});
const md = import.meta.glob<string>('/content/id/modes/soc/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});

export function loadSocContent(): ModeContent {
  const files: Record<string, unknown> = {};
  for (const [path, value] of Object.entries({ ...json, ...md }))
    files[path.slice(PREFIX.length)] = value;
  return parseModeContentOrThrow(files, socCaseSchemas);
}
