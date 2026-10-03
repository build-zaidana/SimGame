import { hashString } from '../../engine/rng.ts';
import { t as id } from '../../i18n/index.ts';
import type { Visitor } from '../contract.ts';

const pick = <T>(xs: readonly T[], key: string, salt: number): T =>
  xs[(hashString(key) >>> salt) % xs.length] as T;

/** Karyawan yang melaporkan kasus: dipilih tetap per ID kasus agar sama setiap kali dibuka. */
export function staffVisitor(caseId: string, lines: readonly string[]): Visitor {
  const who = pick(id.soc.visitors.staff, caseId, 0);
  return { ...who, kind: 'person', line: pick(lines, caseId, 7) };
}

export function systemVisitor(caseId: string): Visitor {
  return {
    ...id.soc.visitors.system,
    kind: 'system',
    line: pick(id.soc.visitors.loginLines, caseId, 7),
  };
}
