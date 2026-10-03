import { hashString } from '../../engine/rng.ts';
import { id } from '../../i18n/id.ts';
import type { Visitor } from '../contract.ts';

const v = id.soc.visitors;
const pick = <T>(xs: readonly T[], key: string, salt: number): T =>
  xs[(hashString(key) >>> salt) % xs.length] as T;

/** Karyawan yang melaporkan kasus: dipilih tetap per ID kasus agar sama setiap kali dibuka. */
export function staffVisitor(caseId: string, lines: readonly string[]): Visitor {
  const who = pick(v.staff, caseId, 0);
  return { ...who, kind: 'person', line: pick(lines, caseId, 7) };
}

export function systemVisitor(caseId: string): Visitor {
  return { ...v.system, kind: 'system', line: pick(v.loginLines, caseId, 7) };
}
