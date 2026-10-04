import { hashString } from '../../engine/rng.ts';
import { t as id } from '../../i18n/index.ts';
import type { Visitor } from '../contract.ts';

const pick = <T>(xs: readonly T[], key: string): T => xs[(hashString(key) >>> 7) % xs.length] as T;

/** Karyawan pemilik tiket/perangkat. Kalimatnya netral: tidak membocorkan jawaban. */
export function personVisitor(
  caseId: string,
  name: string,
  role: string,
  lines: readonly string[],
): Visitor {
  return { name, role, kind: 'person', line: pick(lines, caseId) };
}

export function agentVisitor(caseId: string): Visitor {
  const v = id.support.visitors;
  return { ...v.system, kind: 'system', line: pick(v.systemLines, caseId) };
}
