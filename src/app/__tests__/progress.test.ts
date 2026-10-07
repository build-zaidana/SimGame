import { describe, expect, it } from 'vitest';
import type { ModeContent } from '../../content/loader.ts';
import type { ShiftDef } from '../../content/schemas.ts';
import { shiftReducer, startShift } from '../../engine/shift.ts';
import type { CaseOutcome } from '../../engine/types.ts';
import { createNewSave, newModeProgress } from '../../persistence/saveSchema.ts';
import type { CaseGenerator } from '../../modes/contract.ts';
import {
  awardBadges,
  buildShift,
  commitShift,
  nextShift,
  perksFor,
  rankOf,
  planFromShift,
  practiceShifts,
  reviewItemsFor,
  withGeneratedCases,
} from '../progress.ts';

const shiftDef = (order: number): ShiftDef => ({
  id: `soc-0${order}`,
  order,
  title: `Shift ${order}`,
  durationGameMinutes: 10,
  realSecondsPerGameMinute: 1,
  unlocksChapters: [`ch-${order}`],
  introDialogue: 'in',
  outroDialogue: 'out',
  tutorial: false,
  queue: [
    { caseId: 'a', arriveAt: 0 },
    { caseId: 'b', arriveAt: 3 },
    { generator: 'typosquat-domain', params: {}, arriveAt: 5 },
  ],
  review: { count: 3, conceptIds: ['url'] },
  pay: { base: 100, perCase: 10 },
});

const content = {
  shifts: [shiftDef(1), shiftDef(2)],
  cases: {
    a: { conceptIds: ['url'] },
    b: { conceptIds: ['url', 'phish'] },
  },
} as unknown as ModeContent;

describe('planFromShift', () => {
  it('keeps fixed cases and skips generator entries (generators arrive in M3)', () => {
    expect(planFromShift('soc', shiftDef(1)).cases).toEqual([
      { caseId: 'a', arriveAt: 0 },
      { caseId: 'b', arriveAt: 3 },
    ]);
  });
});

describe('buildShift', () => {
  const fakeGen: CaseGenerator = (params, rng, ctx) => [
    { id: ctx.id, type: 'email', marker: params['brand'], seed: rng.a } as never,
    { a: rng.a + 1 },
  ];

  it('turns generator entries into cases with stable ids, stored as session data', () => {
    const { plan, generatedCases } = buildShift(
      'soc',
      shiftDef(1),
      { 'typosquat-domain': fakeGen },
      42,
    );
    expect(plan.cases).toEqual([
      { caseId: 'a', arriveAt: 0 },
      { caseId: 'b', arriveAt: 3 },
      { caseId: 'soc-01-gen-2', arriveAt: 5 },
    ]);
    expect(Object.keys(generatedCases)).toEqual(['soc-01-gen-2']);
    expect(buildShift('soc', shiftDef(1), { 'typosquat-domain': fakeGen }, 42)).toEqual({
      plan,
      generatedCases,
    });
  });

  it('skips entries whose generator is unknown', () => {
    expect(buildShift('soc', shiftDef(1), {}, 1).plan.cases).toHaveLength(2);
  });
});

describe('withGeneratedCases', () => {
  it('adds valid generated cases to the content and drops invalid ones', () => {
    const s = {
      generatedCases: { good: { id: 'good', type: 'email' }, bad: { id: 'bad', type: 'email' } },
    } as never;
    const schemas = {
      email: {
        safeParse: (x: { id: string }) =>
          x.id === 'good' ? { success: true, data: x } : { success: false },
      },
    } as never;
    const merged = withGeneratedCases(content, s, schemas);
    expect(Object.keys(merged.cases).sort()).toEqual(['a', 'b', 'good']);
    expect(content.cases).not.toHaveProperty('good');
  });
});

describe('nextShift', () => {
  it('picks the unlocked shift; none once every shift is done (replays go through practice)', () => {
    expect(nextShift(content, { ...newModeProgress(), unlockedShift: 2 })?.order).toBe(2);
    expect(nextShift(content, { ...newModeProgress(), unlockedShift: 9 })).toBeUndefined();
  });
});

describe('practiceShifts', () => {
  it('lists completed shifts in order', () => {
    const progress = {
      ...newModeProgress(),
      unlockedShift: 3,
      shifts: {
        'soc-02': { bestScore: 50, stars: 1 as const },
        'soc-01': { bestScore: 90, stars: 3 as const },
      },
    };
    expect(practiceShifts(content, progress).map((s) => s.id)).toEqual(['soc-01', 'soc-02']);
    expect(practiceShifts(content, newModeProgress())).toEqual([]);
  });
});

describe('commitShift', () => {
  const outcome = (caseId: string, correct: boolean): CaseOutcome => ({
    caseId,
    decision: correct ? 'block' : 'allow',
    verdict: 'malicious',
    severity: 1,
    impact: correct ? 'correct' : 'threat-allowed',
    correct,
    decisionScore: correct ? 1 : 0,
    evidenceScore: correct ? 1 : 0,
    missedEvidence: [],
    wrongMarks: [],
  });

  function played() {
    let s = startShift({
      plan: planFromShift('soc', shiftDef(1)),
      seed: 1,
      playMode: 'relaxed',
      trust: 75,
    });
    for (const [id, ok] of [
      ['a', true],
      ['b', false],
    ] as const) {
      s = shiftReducer(s, { type: 'DISMISS_BRIEFING' });
      s = shiftReducer(s, { type: 'OPEN_CASE', caseId: id });
      s = shiftReducer(s, { type: 'DECIDE', outcome: outcome(id, ok) });
      s = shiftReducer(s, { type: 'CLOSE_FEEDBACK' });
    }
    return s;
  }

  const base = () => {
    const save = createNewSave({ installId: '6f1c2b8e-3a4d-4c5e-8f9a-0b1c2d3e4f5a', now: 'T0' });
    return { ...save, modes: { soc: { ...newModeProgress(), activeSession: played() } } };
  };

  it('records results, pays, unlocks the next shift and clears the session', () => {
    const session = played();
    expect(session.phase).toBe('ended');
    const next = commitShift(base(), session, content, 'T1');
    const p = next.modes['soc'];
    expect(p?.activeSession).toBeUndefined();
    expect(p?.shifts['soc-01']).toEqual({ bestScore: 50, stars: 1, completedAt: 'T1' });
    expect(p?.wallet).toBe(110);
    // Shift berakhir di 71; separuh selisih ke 75 dipulihkan untuk shift berikutnya.
    expect(p?.trust).toBe(73);
    expect(p?.unlockedShift).toBe(2);
    expect(p?.chaptersUnlocked).toEqual(['ch-1']);
    expect(next.mastery['concept:url']).toMatchObject({ box: 1, seen: 2, correct: 1 });
    expect(next.updatedAt).toBe('T1');
  });

  it('records review answers in mastery so wrong items come back next shift', () => {
    const next = commitShift(base(), played(), content, 'T1', [
      { itemId: 'q-1', correct: false },
      { itemId: 'q-2', correct: true },
    ]);
    expect(next.mastery['q-1']).toEqual({ box: 1, dueAtShiftIndex: 2, seen: 1, correct: 0 });
    expect(next.mastery['q-2']).toEqual({ box: 2, dueAtShiftIndex: 3, seen: 1, correct: 1 });
  });

  it('keeps the best score on replay and never lowers unlockedShift', () => {
    const first = commitShift(base(), played(), content, 'T1');
    const better = {
      ...first,
      modes: {
        soc: {
          ...first.modes['soc']!,
          unlockedShift: 3,
          shifts: { 'soc-01': { bestScore: 90, stars: 3 as const } },
        },
      },
    };
    const p = commitShift(better, played(), content, 'T2').modes['soc'];
    expect(p?.shifts['soc-01']).toEqual({ bestScore: 90, stars: 3, completedAt: 'T2' });
    expect(p?.unlockedShift).toBe(3);
  });
});

describe('badges on commit and on purchase', () => {
  const badgeContent = {
    ...content,
    tools: [{ id: 't1' }, { id: 't2' }],
    badges: [
      { id: 'first-day', rule: { type: 'shift-complete', shiftId: 'soc-01' } },
      { id: 'reviewer', rule: { type: 'review-perfect' } },
      { id: 'collector', rule: { type: 'tools-owned', count: 1 } },
    ],
  } as unknown as ModeContent;

  function playedShift() {
    let s = startShift({
      plan: planFromShift('soc', shiftDef(1)),
      seed: 1,
      playMode: 'relaxed',
      trust: 75,
    });
    s = shiftReducer(s, { type: 'DISMISS_BRIEFING' });
    return shiftReducer(s, { type: 'END_SHIFT' });
  }
  const fresh = () =>
    createNewSave({ installId: '6f1c2b8e-3a4d-4c5e-8f9a-0b1c2d3e4f5a', now: 'T0' });

  it('awards earned badges with a timestamp and never twice', () => {
    const once = commitShift(fresh(), playedShift(), badgeContent, 'T1', [
      { itemId: 'q-1', correct: true },
    ]);
    expect(once.modes['soc']?.badges).toEqual({ 'first-day': 'T1', reviewer: 'T1' });
    const twice = commitShift(once, playedShift(), badgeContent, 'T2', []);
    expect(twice.modes['soc']?.badges).toEqual({ 'first-day': 'T1', reviewer: 'T1' });
  });

  it('awards tool badges right after a purchase (no shift rules)', () => {
    const progress = { ...newModeProgress(), toolsOwned: ['t1'] };
    const { progress: next, earned } = awardBadges(progress, badgeContent, 'T3');
    expect(earned).toEqual(['collector']);
    expect(next.badges).toEqual({ collector: 'T3' });
  });
});

describe('reviewItemsFor', () => {
  const reviewContent = {
    ...content,
    rulebook: { chapters: [{ id: 'ch-1', conceptId: 'url', unlockAtShift: 1, rules: [] }] },
    review: [
      { id: 'u1', conceptId: 'url' },
      { id: 'u2', conceptId: 'url' },
      { id: 'u3', conceptId: 'url' },
      { id: 'u4', conceptId: 'url' },
      { id: 'p1', conceptId: 'phish' },
    ],
  } as unknown as ModeContent;

  it('is stable for the same session and limited to the shift count', () => {
    const s = startShift({
      plan: planFromShift('soc', shiftDef(1)),
      seed: 3,
      playMode: 'relaxed',
      trust: 75,
    });
    const a = reviewItemsFor(reviewContent, s, {});
    expect(a).toHaveLength(3);
    expect(reviewItemsFor(reviewContent, s, {})).toEqual(a);
  });

  it('includes items answered wrong in the previous shift', () => {
    const s2 = startShift({
      plan: planFromShift('soc', shiftDef(2)),
      seed: 3,
      playMode: 'relaxed',
      trust: 75,
    });
    const mastery = { p1: { box: 1 as const, dueAtShiftIndex: 2, seen: 1, correct: 0 } };
    expect(reviewItemsFor(reviewContent, s2, mastery).map((i) => i.id)).toContain('p1');
  });
});

describe('rankOf / perksFor (ADR 027)', () => {
  const withUpgrades = {
    ...content,
    upgrades: [
      { id: 'plant', price: 30, requiresRank: 0, effect: { kind: 'cosmetic' } },
      { id: 'coffee', price: 120, requiresRank: 1, effect: { kind: 'free-hints', value: 2 } },
      { id: 'monitor', price: 160, requiresRank: 2, effect: { kind: 'shift-time', percent: 15 } },
    ],
  } as unknown as ModeContent;
  const done = (stars: 0 | 1 | 2 | 3) => ({ bestScore: 80, stars, completedAt: '2026-10-01' });

  it('ranks by completed shifts of the mode', () => {
    const p = newModeProgress();
    expect(rankOf(p, withUpgrades)).toBe(0);
    expect(rankOf({ ...p, shifts: { 'soc-01': done(2) } }, withUpgrades)).toBe(3);
    expect(rankOf({ ...p, shifts: { 'soc-01': done(0), 'soc-02': done(1) } }, withUpgrades)).toBe(
      4,
    );
  });

  it('ignores shift records without a completion time', () => {
    const p = { ...newModeProgress(), shifts: { 'soc-01': { bestScore: 0, stars: 0 as const } } };
    expect(rankOf(p, withUpgrades)).toBe(0);
  });

  it('turns owned upgrades and rank into session perks', () => {
    const p = {
      ...newModeProgress(),
      shifts: { 'soc-01': done(2) },
      upgradesOwned: ['plant', 'coffee', 'monitor', 'gone'],
    };
    expect(perksFor(p, withUpgrades)).toEqual({ freeHints: 2, payBonus: 30, shiftTimePercent: 15 });
    expect(perksFor(newModeProgress(), withUpgrades)).toEqual({
      freeHints: 1,
      payBonus: 0,
      shiftTimePercent: 0,
    });
  });
});
