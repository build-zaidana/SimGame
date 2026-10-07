import type { SaveData } from '../persistence/saveSchema.ts';

/**
 * Tips untuk pemain baru (ADR 030): satu kartu di kantor, muncul saat fiturnya baru relevan.
 * Status disimpan di `save.flags` (`tip:<id>`), jadi bentuk save tidak berubah.
 */
export const TIP_IDS = ['welcome', 'rank', 'daily', 'shop', 'practice'] as const;
export type TipId = (typeof TIP_IDS)[number];

/** Harga upgrade meja termurah: tips Toko baru muncul saat gaji cukup untuk membeli sesuatu. */
const CHEAPEST_UPGRADE = 30;

const flagOf = (id: TipId) => `tip:${id}`;

function finishedAnyShift(save: SaveData): boolean {
  return Object.values(save.modes).some((m) =>
    Object.values(m.shifts).some((s) => s.completedAt !== undefined),
  );
}

const READY: Record<TipId, (save: SaveData) => boolean> = {
  welcome: () => true,
  rank: finishedAnyShift,
  daily: finishedAnyShift,
  shop: (save) =>
    finishedAnyShift(save) && Object.values(save.modes).some((m) => m.wallet >= CHEAPEST_UPGRADE),
  practice: finishedAnyShift,
};

/** Tips berikutnya yang belum dilihat dan sudah relevan; null bila tidak ada. */
export function nextTip(save: SaveData): TipId | null {
  return TIP_IDS.find((id) => !save.flags[flagOf(id)] && READY[id](save)) ?? null;
}

const withFlags = (save: SaveData, flags: Record<string, boolean>): SaveData => ({
  ...save,
  flags,
});

export function dismissTip(save: SaveData, id: TipId): SaveData {
  return withFlags(save, { ...save.flags, [flagOf(id)]: true });
}

export function skipAllTips(save: SaveData): SaveData {
  return withFlags(save, {
    ...save.flags,
    ...Object.fromEntries(TIP_IDS.map((id) => [flagOf(id), true])),
  });
}

export function resetTips(save: SaveData): SaveData {
  return withFlags(
    save,
    Object.fromEntries(Object.entries(save.flags).filter(([k]) => !k.startsWith('tip:'))),
  );
}
