import type { ShiftSession } from './types.ts';

/**
 * Boss akhir shift (ADR 028). HP = banyak kasus boss; setiap keputusan benar memukul boss.
 * Boss kalah hanya bila semua kasusnya benar; satu kesalahan, kasus terlewat, atau waktu habis
 * (mode Normal) membuat boss lolos.
 */
export type BossStatus = 'pending' | 'active' | 'defeated' | 'escaped';

export interface BossState {
  status: BossStatus;
  hp: number;
  maxHp: number;
  /** Sisa waktu nyata (ms) sampai batas boss; 0 bila sudah lewat. */
  msLeft: number;
}

export function bossState(s: ShiftSession): BossState | null {
  const boss = s.boss;
  if (!boss) return null;
  const cases = s.cases.filter((c) => boss.caseIds.includes(c.caseId));
  const maxHp = cases.length;
  const hits = cases.filter((c) => c.status === 'decided' && c.outcome?.correct).length;
  const failed = cases.some(
    (c) => c.status === 'missed' || (c.status === 'decided' && !c.outcome?.correct),
  );
  const msLeft = Math.max(0, boss.endsAtMs - s.elapsedMs);
  const status: BossStatus =
    maxHp > 0 && hits === maxHp
      ? 'defeated'
      : failed
        ? 'escaped'
        : s.elapsedMs < boss.startsAtMs
          ? 'pending'
          : 'active';
  return { status, hp: maxHp - hits, maxHp, msLeft };
}

/** Bonus gaji boss: penuh bila boss kalah, selain itu 0. */
export function bossBonus(s: ShiftSession): number {
  return bossState(s)?.status === 'defeated' ? (s.boss?.reward ?? 0) : 0;
}
