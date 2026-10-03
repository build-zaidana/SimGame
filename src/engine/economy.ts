import type { CaseImpact, Severity } from './types.ts';

/** Perubahan Kepercayaan Klien per kasus (ARCHITECTURE §6.2). */
export function trustDelta(impact: CaseImpact, severity: Severity): number {
  switch (impact) {
    case 'correct':
      return 1;
    case 'threat-allowed':
      return -5 * severity;
    case 'legit-blocked':
      return -3;
    case 'needless-escalation':
      return -1;
    case 'partial':
    case 'wrong':
      return 0;
  }
}

export function applyTrust(trust: number, delta: number): number {
  return Math.min(100, Math.max(0, trust + delta));
}

export interface PayRule {
  base: number;
  perCorrect: number;
}

export function shiftPay(pay: PayRule, correctCount: number): number {
  return pay.base + pay.perCorrect * correctCount;
}

export type BuyResult =
  | { ok: true; wallet: number; toolsOwned: string[] }
  | { ok: false; reason: 'insufficient-funds' | 'already-owned' };

/** Membeli alat di toko. Murni: mengembalikan dompet & daftar alat yang baru. */
export function buyTool(
  state: { wallet: number; toolsOwned: readonly string[] },
  tool: { id: string; price: number },
): BuyResult {
  if (state.toolsOwned.includes(tool.id)) return { ok: false, reason: 'already-owned' };
  if (state.wallet < tool.price) return { ok: false, reason: 'insufficient-funds' };
  return {
    ok: true,
    wallet: state.wallet - tool.price,
    toolsOwned: [...state.toolsOwned, tool.id],
  };
}
