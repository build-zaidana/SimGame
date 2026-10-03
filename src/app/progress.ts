import type { ModeContent } from '../content/loader.ts';
import type { ReviewItem, ShiftDef } from '../content/schemas.ts';
import { recordResult, recordShiftConcepts, type MasteryMap } from '../engine/mastery.ts';
import { createRng } from '../engine/rng.ts';
import { selectReviewItems } from '../engine/review.ts';
import { summarizeShift } from '../engine/shift.ts';
import type { ShiftPlan, ShiftSession } from '../engine/types.ts';
import { newModeProgress, type ModeProgress, type SaveData } from '../persistence/saveSchema.ts';

/** ShiftDef (konten) → ShiftPlan (engine). Entri generator diabaikan sampai M3. */
export function planFromShift(modeId: string, shift: ShiftDef): ShiftPlan {
  return {
    shiftId: shift.id,
    modeId,
    order: shift.order,
    durationGameMinutes: shift.durationGameMinutes,
    realSecondsPerGameMinute: shift.realSecondsPerGameMinute,
    cases: shift.queue.flatMap((q) =>
      'caseId' in q ? [{ caseId: q.caseId, arriveAt: q.arriveAt }] : [],
    ),
  };
}

/** Shift yang terbuka; jika belum ada konten untuknya, shift terakhir (ulangi). */
export function nextShift(content: ModeContent, progress: ModeProgress): ShiftDef | undefined {
  return (
    content.shifts.find((s) => s.order === progress.unlockedShift) ??
    content.shifts.filter((s) => s.order <= progress.unlockedShift).at(-1)
  );
}

export interface ReviewResult {
  itemId: string;
  correct: boolean;
}

/** Soal Review Cepat untuk shift yang baru selesai. Deterministik per seed sesi (aman saat reload). */
export function reviewItemsFor(
  content: ModeContent,
  session: ShiftSession,
  mastery: MasteryMap,
): ReviewItem[] {
  const shift = content.shifts.find((s) => s.id === session.shiftId);
  if (!shift) return [];
  const newConceptIds = content.rulebook.chapters
    .filter((ch) => ch.unlockAtShift === session.shiftOrder)
    .map((ch) => ch.conceptId);
  const ids = selectReviewItems({
    items: content.review,
    mastery,
    shiftIndex: session.shiftOrder,
    conceptIds: shift.review.conceptIds,
    newConceptIds,
    count: shift.review.count,
    rng: createRng(session.seed ^ 0x5eed),
  });
  return ids.flatMap((rid) => content.review.filter((r) => r.id === rid));
}

/** Menyimpan hasil shift yang selesai ke save (skor terbaik, gaji, kepercayaan, mastery). */
export function commitShift(
  save: SaveData,
  session: ShiftSession,
  content: ModeContent,
  now: string,
  reviewResults: readonly ReviewResult[] = [],
): SaveData {
  const shift = content.shifts.find((s) => s.id === session.shiftId);
  const progress = save.modes[session.modeId] ?? newModeProgress();
  const summary = summarizeShift(session, shift?.pay ?? { base: 0, perCorrect: 0 });
  const prev = progress.shifts[session.shiftId];
  const best = !prev || summary.averageScore >= prev.bestScore;

  const { activeSession: _done, ...rest } = progress;
  const nextProgress: ModeProgress = {
    ...rest,
    shifts: {
      ...progress.shifts,
      [session.shiftId]: {
        bestScore: best ? summary.averageScore : (prev?.bestScore ?? 0),
        stars: best ? summary.stars : (prev?.stars ?? 0),
        completedAt: now,
      },
    },
    wallet: progress.wallet + summary.pay,
    trust: summary.trust,
    unlockedShift: Math.max(progress.unlockedShift, session.shiftOrder + 1),
    chaptersUnlocked: [
      ...new Set([...progress.chaptersUnlocked, ...(shift?.unlocksChapters ?? [])]),
    ],
  };

  const results = session.cases.map((c) => ({
    conceptIds: content.cases[c.caseId]?.conceptIds ?? [],
    correct: c.outcome?.correct ?? false,
  }));

  return {
    ...save,
    updatedAt: now,
    modes: { ...save.modes, [session.modeId]: nextProgress },
    mastery: reviewResults.reduce(
      (m, r) => recordResult(m, r.itemId, r.correct, session.shiftOrder),
      recordShiftConcepts(save.mastery, results, session.shiftOrder),
    ),
  };
}
