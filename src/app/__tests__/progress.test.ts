import { describe, expect, it } from 'vitest';
import type { ModeContent } from '../../content/loader.ts';
import type { ShiftDef } from '../../content/schemas.ts';
import { shiftReducer, startShift } from '../../engine/shift.ts';
import type { CaseOutcome } from '../../engine/types.ts';
import { createNewSave, newModeProgress } from '../../persistence/saveSchema.ts';
import { commitShift, nextShift, planFromShift } from '../progress.ts';

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
  pay: { base: 100, perCorrect: 10 },
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

describe('nextShift', () => {
  it('picks the unlocked shift, or the last one when no newer shift exists', () => {
    expect(nextShift(content, { ...newModeProgress(), unlockedShift: 2 })?.order).toBe(2);
    expect(nextShift(content, { ...newModeProgress(), unlockedShift: 9 })?.order).toBe(2);
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
    expect(p?.trust).toBe(71);
    expect(p?.unlockedShift).toBe(2);
    expect(p?.chaptersUnlocked).toEqual(['ch-1']);
    expect(next.mastery['concept:url']).toMatchObject({ box: 1, seen: 2, correct: 1 });
    expect(next.updatedAt).toBe('T1');
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
