/**
 * Leitner 3 kotak. Jatuh tempo diukur per shift: kotak 1 = shift berikutnya,
 * kotak 2 = 2 shift lagi, kotak 3 = 4 shift lagi (ARCHITECTURE §6.3).
 */
export type Box = 1 | 2 | 3;

export interface MasteryEntry {
  box: Box;
  dueAtShiftIndex: number;
  seen: number;
  correct: number;
}

export type MasteryMap = Record<string, MasteryEntry>;

const DUE_OFFSET: Record<Box, number> = { 1: 1, 2: 2, 3: 4 };

/** Key mastery untuk konsep; soal review memakai ID soalnya langsung. */
export const conceptKey = (conceptId: string) => `concept:${conceptId}`;

function nextEntry(
  prev: MasteryEntry | undefined,
  correct: boolean,
  shiftIndex: number,
  seen: number,
  correctCount: number,
): MasteryEntry {
  const startBox: Box = prev?.box ?? 1;
  const box: Box = correct ? (Math.min(3, startBox + 1) as Box) : 1;
  return {
    box,
    dueAtShiftIndex: shiftIndex + DUE_OFFSET[box],
    seen: (prev?.seen ?? 0) + seen,
    correct: (prev?.correct ?? 0) + correctCount,
  };
}

export function recordResult(
  m: MasteryMap,
  itemId: string,
  correct: boolean,
  shiftIndex: number,
): MasteryMap {
  return { ...m, [itemId]: nextEntry(m[itemId], correct, shiftIndex, 1, correct ? 1 : 0) };
}

/** Satu pembaruan per konsep per shift; dianggap benar jika akurasi kasus ≥ 75%. */
export function recordShiftConcepts(
  m: MasteryMap,
  results: readonly { conceptIds: readonly string[]; correct: boolean }[],
  shiftIndex: number,
): MasteryMap {
  const tally = new Map<string, { seen: number; correct: number }>();
  for (const r of results) {
    for (const id of r.conceptIds) {
      const t = tally.get(id) ?? { seen: 0, correct: 0 };
      t.seen += 1;
      if (r.correct) t.correct += 1;
      tally.set(id, t);
    }
  }
  const out = { ...m };
  for (const [id, t] of tally) {
    const key = conceptKey(id);
    out[key] = nextEntry(out[key], t.correct / t.seen >= 0.75, shiftIndex, t.seen, t.correct);
  }
  return out;
}

export function isDue(e: MasteryEntry, shiftIndex: number): boolean {
  return e.dueAtShiftIndex <= shiftIndex;
}

/** 0–1: separuh dari akurasi kasus, separuh dari posisi kotak Leitner. */
export function masteryOf(m: MasteryMap, conceptId: string): number {
  const e = m[conceptKey(conceptId)];
  if (!e || e.seen === 0) return 0;
  return 0.5 * (e.correct / e.seen) + 0.5 * ((e.box - 1) / 2);
}
