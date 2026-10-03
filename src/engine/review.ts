import { isDue, type MasteryMap } from './mastery.ts';
import { nextFloat, type RngState } from './rng.ts';

export interface ReviewItemRef {
  id: string;
  conceptId: string;
}

export interface SelectReviewArgs {
  items: readonly ReviewItemRef[];
  mastery: MasteryMap;
  /** Urutan shift yang baru selesai; dipakai untuk jatuh tempo Leitner. */
  shiftIndex: number;
  /** Konsep yang dilatih shift ini. */
  conceptIds: readonly string[];
  /** Konsep yang baru dibuka shift ini; minimal satu soal diambil dari sini. */
  newConceptIds: readonly string[];
  count: number;
  rng: RngState;
}

function shuffle<T>(xs: readonly T[], rng: RngState): [T[], RngState] {
  const out = [...xs];
  let s = rng;
  for (let i = out.length - 1; i > 0; i--) {
    const [f, next] = nextFloat(s);
    s = next;
    const j = Math.floor(f * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return [out, s];
}

/**
 * Review Cepat: ≥ 1 soal dari konsep baru, lalu soal jatuh tempo dari kotak terendah
 * (dari konsep mana pun), lalu sisa soal dari konsep shift ini. Deterministik per seed.
 */
export function selectReviewItems(args: SelectReviewArgs): string[] {
  const { items, mastery, shiftIndex, count } = args;
  const [shuffled] = shuffle(items, args.rng);
  const picked: string[] = [];
  const take = (item: ReviewItemRef | undefined) => {
    if (item && picked.length < count && !picked.includes(item.id)) picked.push(item.id);
  };

  const unseenFirst = (a: ReviewItemRef, b: ReviewItemRef) =>
    Number(a.id in mastery) - Number(b.id in mastery);
  take(shuffled.filter((i) => args.newConceptIds.includes(i.conceptId)).sort(unseenFirst)[0]);

  const due = shuffled
    .filter((i) => {
      const e = mastery[i.id];
      return e !== undefined && isDue(e, shiftIndex);
    })
    .sort((a, b) => (mastery[a.id]?.box ?? 0) - (mastery[b.id]?.box ?? 0));
  due.forEach(take);

  shuffled
    .filter((i) => args.conceptIds.includes(i.conceptId))
    .sort(unseenFirst)
    .forEach(take);

  return picked;
}

export function gradeMcq(answerIndex: number, chosen: number): boolean {
  return answerIndex === chosen;
}

/** Benar jika semua bagian jawaban ditandai dan tidak ada tanda lain. */
export function gradeTapEvidence(answer: readonly string[], marks: readonly string[]): boolean {
  const m = new Set(marks);
  return m.size === answer.length && answer.every((a) => m.has(a));
}

/** `order` = indeks langkah asli dalam urutan yang disusun pemain. */
export function gradeOrderSteps(order: readonly number[]): boolean {
  return order.every((v, i) => v === i);
}

/** Urutan acak awal untuk soal order-steps; tidak pernah sudah terurut (n ≥ 2). */
export function shuffledOrder(n: number, rng: RngState): number[] {
  const [order] = shuffle(
    Array.from({ length: n }, (_, i) => i),
    rng,
  );
  if (n >= 2 && gradeOrderSteps(order)) order.reverse();
  return order;
}
