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

/** Kepercayaan awal pemain baru; juga titik pemulihan antar-shift. */
export const BASELINE_TRUST = 75;

/**
 * Kepercayaan untuk shift berikutnya: bila di bawah titik awal, separuh selisihnya pulih
 * (dibulatkan ke atas). Satu shift buruk tetap terasa, tapi tidak menyeret pemula sampai akhir.
 */
export function carryTrust(trust: number): number {
  return trust >= BASELINE_TRUST ? trust : trust + Math.ceil((BASELINE_TRUST - trust) / 2);
}

export interface PayRule {
  base: number;
  /** Gaji untuk satu kasus bernilai 100; kasus dibayar sebanding skornya. */
  perCase: number;
}

/** Gaji shift = base + perCase × Σ(skor/100). Bukti yang lengkap ikut menaikkan gaji. */
export function shiftPay(pay: PayRule, scores: readonly number[]): number {
  const earned = scores.reduce((sum, score) => sum + score, 0);
  return pay.base + Math.round((pay.perCase * earned) / 100);
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
