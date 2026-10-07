import { createRng, hashString, nextInt } from './rng.ts';

/**
 * Tantangan harian (ADR 029). Murni: tanggal ('YYYY-MM-DD', waktu lokal pemain) diberikan dari luar,
 * tidak pernah dibaca dari jam di sini.
 */
export const DAILY_CASES = 3;
const PAY_PER_CORRECT = 10;
const STREAK_BONUS = 5;
const STREAK_BONUS_CAP = 5;

/** Kasus tantangan hari ini: sama untuk semua pemain di tanggal & mode yang sama. */
export function dailyCases(
  pool: readonly string[],
  date: string,
  modeId: string,
  count = DAILY_CASES,
): string[] {
  const left = [...pool];
  const picked = new Set<string>();
  let rng = createRng(hashString(`daily:${modeId}:${date}`));
  while (picked.size < count && left.length > 0) {
    const [i, next] = nextInt(rng, 0, left.length - 1);
    rng = next;
    picked.add(left.splice(i, 1)[0] as string);
  }
  return pool.filter((c) => picked.has(c));
}

/** Tanggal sehari sebelumnya ('YYYY-MM-DD'), dihitung dengan kalender Gregorian tanpa jam sistem. */
export function previousDate(date: string): string {
  let [y, m, d] = date.split('-').map(Number) as [number, number, number];
  d -= 1;
  if (d === 0) {
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    d = daysInMonth(y, m);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

function daysInMonth(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** Streak sesudah menyelesaikan tantangan pada `date`. */
export function nextDailyStreak(
  prev: { streak: number; lastDate?: string | undefined },
  date: string,
): number {
  if (prev.lastDate === date) return Math.max(1, prev.streak);
  return prev.lastDate === previousDate(date) ? prev.streak + 1 : 1;
}

/** Hadiah: Rp 10 per kasus benar; semua benar = bonus streak (Rp 5 per hari, maks. 5 hari). */
export function dailyReward(correct: number, total: number, streak: number): number {
  const perfect = total > 0 && correct === total;
  return (
    PAY_PER_CORRECT * correct + (perfect ? STREAK_BONUS * Math.min(streak, STREAK_BONUS_CAP) : 0)
  );
}
