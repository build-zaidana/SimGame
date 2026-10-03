import { PixelCanvas } from './canvas.ts';
import { tint } from './portraits.ts';

/** Medali lencana 20×24 (pita + koin), digambar dari kode. */
export const MEDAL_W = 20;
export const MEDAL_H = 24;
export type MedalTier = 'bronze' | 'silver' | 'gold';

const TIER: Record<MedalTier, string> = { bronze: '#c9814a', silver: '#c3cad6', gold: '#f2c14e' };
const RIBBON: Record<MedalTier, [string, string]> = {
  bronze: ['#4e7fd0', '#d0644e'],
  silver: ['#4ea889', '#8e63c4'],
  gold: ['#d0644e', '#f2c14e'],
};
const LOCKED = '#5d6b82';

const cache = new Map<string, { fill: string; d: string }[]>();

export function medalPaths(tier: MedalTier, locked: boolean): { fill: string; d: string }[] {
  const key = `${tier}:${locked}`;
  let paths = cache.get(key);
  if (!paths) {
    const p = new PixelCanvas(MEDAL_W, MEDAL_H);
    const [a, b] = locked ? ['#3a4258', '#48536a'] : RIBBON[tier];
    p.line(5, 0, 8, 8, a).line(6, 0, 9, 8, a).line(7, 0, 10, 8, a);
    p.line(14, 0, 11, 8, b).line(13, 0, 10, 8, b).line(12, 0, 9, 8, b);
    const coin = locked ? LOCKED : TIER[tier];
    p.ellipse(10, 15, 8, 8, coin, { shade: tint(coin, 0.72), light: tint(coin, 1.25) });
    p.ellipse(10, 15, 5.6, 5.6, tint(coin, 0.88));
    paths = p.outline('#14101c').toPaths();
    cache.set(key, paths);
  }
  return paths;
}
