import { hashString } from '../../engine/rng.ts';
import { t as id } from '../../i18n/index.ts';
import type { Visitor } from '../contract.ts';

const pick = <T>(xs: readonly T[], key: string): T => xs[(hashString(key) >>> 7) % xs.length] as T;

/** Rekan kerja yang membawa tugas/PR. Kalimatnya netral: tidak membocorkan jawaban. */
export function personVisitor(
  caseId: string,
  name: string,
  role: string,
  lines: readonly string[],
): Visitor {
  return { name, role, kind: 'person', line: pick(lines, caseId) };
}

export function ctfVisitor(caseId: string): Visitor {
  const v = id.dev.visitors;
  return { ...v.ctf, kind: 'system', line: pick(v.ctfLines, caseId) };
}
