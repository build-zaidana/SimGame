import type { CaseSchemas, ModeContent } from '../content/loader.ts';
import type { ReviewItem, ShiftDef } from '../content/schemas.ts';
import { newBadges, type BadgeRule } from '../engine/badges.ts';
import { carryTrust, upgradePerks } from '../engine/economy.ts';
import { careerRank, rankPayBonus, type RankInput } from '../engine/rank.ts';
import { bossState } from '../engine/boss.ts';
import { dailyCases, dailyReward, nextDailyStreak } from '../engine/daily.ts';
import { recordResult, recordShiftConcepts, type MasteryMap } from '../engine/mastery.ts';
import { createRng } from '../engine/rng.ts';
import { selectReviewItems } from '../engine/review.ts';
import { summarizeShift } from '../engine/shift.ts';
import type { SessionPerks, ShiftPlan, ShiftSession } from '../engine/types.ts';
import type { CaseGenerator } from '../modes/contract.ts';
import { newModeProgress, type ModeProgress, type SaveData } from '../persistence/saveSchema.ts';

/** ShiftDef (konten) → ShiftPlan (engine), hanya kasus tetap. */
export function planFromShift(modeId: string, shift: ShiftDef): ShiftPlan {
  return buildShift(modeId, shift, {}, 0).plan;
}

/**
 * ShiftDef → ShiftPlan + kasus prosedural. Generator dijalankan sekali saat shift dimulai;
 * hasilnya disimpan di sesi (`generatedCases`) supaya shift yang dilanjutkan tetap sama.
 */
export function buildShift(
  modeId: string,
  shift: ShiftDef,
  generators: Record<string, CaseGenerator>,
  seed: number,
  locale: 'id' | 'en' = 'id',
): { plan: ShiftPlan; generatedCases: Record<string, unknown> } {
  let rng = createRng(seed ^ 0x9e3779b9);
  const generatedCases: Record<string, unknown> = {};
  const cases: ShiftPlan['cases'] = [];
  shift.queue.forEach((q, i) => {
    if ('caseId' in q) {
      cases.push({ caseId: q.caseId, arriveAt: q.arriveAt });
      return;
    }
    const generate = generators[q.generator];
    if (!generate) return;
    const id = `${shift.id}-gen-${i}`;
    const [c, next] = generate(q.params, rng, { id, locale });
    rng = next;
    generatedCases[id] = c;
    cases.push({ caseId: id, arriveAt: q.arriveAt });
  });
  return {
    plan: {
      shiftId: shift.id,
      modeId,
      order: shift.order,
      durationGameMinutes: shift.durationGameMinutes,
      realSecondsPerGameMinute: shift.realSecondsPerGameMinute,
      cases,
      ...(shift.boss
        ? {
            boss: {
              caseIds: shift.boss.caseIds,
              arriveAt: shift.boss.arriveAt,
              durationGameMinutes: shift.boss.durationGameMinutes,
              reward: shift.boss.reward,
            },
          }
        : {}),
    },
    generatedCases,
  };
}

/** Konten mode + kasus prosedural sesi ini (divalidasi ulang dengan skema tipe kasus). */
export function withGeneratedCases(
  content: ModeContent,
  session: Pick<ShiftSession, 'generatedCases'>,
  schemas: CaseSchemas,
): ModeContent {
  const extra: ModeContent['cases'] = {};
  for (const [cid, raw] of Object.entries(session.generatedCases)) {
    const type = (raw as { type?: unknown } | null)?.type;
    const parsed = typeof type === 'string' ? schemas[type]?.safeParse(raw) : undefined;
    if (parsed?.success) extra[cid] = parsed.data;
  }
  return Object.keys(extra).length === 0
    ? content
    : { ...content, cases: { ...content.cases, ...extra } };
}

/** Shift berikutnya di jalur utama; tidak ada bila semua shift selesai (ulangi lewat Latihan). */
export function nextShift(content: ModeContent, progress: ModeProgress): ShiftDef | undefined {
  return content.shifts.find((s) => s.order === progress.unlockedShift);
}

/** Shift yang sudah pernah diselesaikan dan bisa diulang di Mode Latihan (PRD S5). */
export function practiceShifts(content: ModeContent, progress: ModeProgress): ShiftDef[] {
  return content.shifts.filter((s) => s.id in progress.shifts);
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

/**
 * Memberi lencana yang baru terpenuhi (PRD C3). Tanpa `shift`, hanya aturan di luar shift yang
 * dinilai (mis. jumlah alat setelah membeli). Mengembalikan progres baru + ID lencana baru.
 */
export function awardBadges(
  progress: ModeProgress,
  content: ModeContent,
  now: string,
  shift?: {
    session: ShiftSession;
    stars: number;
    trust: number;
    reviewResults: readonly ReviewResult[];
  },
): { progress: ModeProgress; earned: string[] } {
  const defs = (content.badges ?? []).map((b) => ({ id: b.id, rule: b.rule as BadgeRule }));
  const earned = newBadges(defs, progress.badges, {
    shiftId: shift?.session.shiftId ?? null,
    cases: shift?.session.cases ?? [],
    stars: shift?.stars ?? 0,
    trust: shift?.trust ?? progress.trust,
    toolsOwned: progress.toolsOwned.length,
    reviewResults: shift?.reviewResults ?? [],
    bossDefeated: shift ? bossState(shift.session)?.status === 'defeated' : false,
  });
  if (earned.length === 0) return { progress, earned };
  const badges = { ...progress.badges, ...Object.fromEntries(earned.map((id) => [id, now])) };
  return { progress: { ...progress, badges }, earned };
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
  const summary = summarizeShift(session, shift?.pay ?? { base: 0, perCase: 0 });
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
    trust: carryTrust(summary.trust),
    unlockedShift: Math.max(progress.unlockedShift, session.shiftOrder + 1),
    chaptersUnlocked: [
      ...new Set([...progress.chaptersUnlocked, ...(shift?.unlocksChapters ?? [])]),
    ],
  };

  const { progress: withBadges } = awardBadges(nextProgress, content, now, {
    session,
    stars: summary.stars,
    trust: summary.trust,
    reviewResults,
  });

  const results = session.cases.map((c) => ({
    conceptIds: content.cases[c.caseId]?.conceptIds ?? [],
    correct: c.outcome?.correct ?? false,
  }));

  return {
    ...save,
    updatedAt: now,
    modes: { ...save.modes, [session.modeId]: withBadges },
    mastery: reviewResults.reduce(
      (m, r) => recordResult(m, r.itemId, r.correct, session.shiftOrder),
      recordShiftConcepts(save.mastery, results, session.shiftOrder),
    ),
  };
}

/** Masukan pangkat dari progres sebuah mode (hanya shift yang benar-benar selesai). */
export function rankInput(progress: ModeProgress, content: ModeContent): RankInput {
  const done = content.shifts
    .map((s) => progress.shifts[s.id])
    .filter((r) => r?.completedAt !== undefined);
  return { completedShifts: done.length, totalShifts: content.shifts.length };
}

/** Pangkat karier (0 = Magang … 4 = Lead) di mode ini (ADR 027). */
export function rankOf(progress: ModeProgress, content: ModeContent): number {
  return careerRank(rankInput(progress, content));
}

/** Keuntungan yang dicatat ke sesi saat shift dimulai: upgrade meja + tunjangan pangkat. */
export function perksFor(progress: ModeProgress, content: ModeContent): SessionPerks {
  const owned = content.upgrades.filter((u) => progress.upgradesOwned.includes(u.id));
  return {
    ...upgradePerks(owned.map((u) => u.effect)),
    payBonus: rankPayBonus(rankOf(progress, content)),
  };
}

/** Lama tantangan harian (menit game); kecepatan jam ikut shift pertama mode itu. */
const DAILY_GAME_MINUTES = 90;

/** Kasus untuk tantangan harian: kasus tetap dari shift yang sudah diselesaikan (materinya dikenal). */
export function dailyPool(content: ModeContent, progress: ModeProgress): string[] {
  const ids = practiceShifts(content, progress).flatMap((s) =>
    s.queue.flatMap((q) => ('caseId' in q ? [q.caseId] : [])),
  );
  return [...new Set(ids)].filter((id) => id in content.cases);
}

/** Rencana tantangan harian (ADR 029): semua kasus datang sekaligus. null bila belum ada shift selesai. */
export function buildDaily(
  modeId: string,
  content: ModeContent,
  progress: ModeProgress,
  date: string,
): ShiftPlan | null {
  const cases = dailyCases(dailyPool(content, progress), date, modeId);
  const first = content.shifts[0];
  if (cases.length === 0 || !first) return null;
  return {
    shiftId: `daily-${date}`,
    modeId,
    order: Math.max(...practiceShifts(content, progress).map((s) => s.order)),
    durationGameMinutes: DAILY_GAME_MINUTES,
    realSecondsPerGameMinute: first.realSecondsPerGameMinute,
    cases: cases.map((caseId) => ({ caseId, arriveAt: 0 })),
  };
}

/** Menutup tantangan harian: hadiah ke dompet mode, streak naik, slot latihan dikosongkan. */
export function commitDaily(
  save: SaveData,
  session: ShiftSession,
  now: string,
): { save: SaveData; reward: number } {
  const date = session.daily?.date;
  const progress = save.modes[session.modeId];
  if (!date || !progress) return { save, reward: 0 };
  const prev = save.daily ?? { streak: 0, best: 0, done: {} };
  // Tantangan kemarin yang baru diselesaikan hari ini tidak memundurkan streak.
  const stale = prev.lastDate !== undefined && date < prev.lastDate;
  const streak = stale ? prev.streak : nextDailyStreak(prev, date);
  const correct = session.cases.filter((c) => c.outcome?.correct).length;
  // Hadiah hanya sekali per mode per hari.
  const reward =
    prev.done[session.modeId] === date ? 0 : dailyReward(correct, session.cases.length, streak);
  const { practiceSession: _done, ...rest } = progress;
  return {
    reward,
    save: {
      ...save,
      updatedAt: now,
      modes: { ...save.modes, [session.modeId]: { ...rest, wallet: progress.wallet + reward } },
      daily: {
        streak,
        best: Math.max(prev.best, streak),
        lastDate: stale ? prev.lastDate : date,
        done: { ...prev.done, [session.modeId]: date },
      },
    },
  };
}
