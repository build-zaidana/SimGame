import { describe, expect, it } from 'vitest';
import { isDue, masteryOf, recordResult, recordShiftConcepts } from '../mastery.ts';

describe('recordResult (Leitner, 3 boxes)', () => {
  it('a new correct item goes to box 2, due 2 shifts later', () => {
    const m = recordResult({}, 'q1', true, 1);
    expect(m.q1).toEqual({ box: 2, dueAtShiftIndex: 3, seen: 1, correct: 1 });
  });
  it('a wrong item goes to box 1, due next shift', () => {
    const m = recordResult({}, 'q1', false, 1);
    expect(m.q1).toEqual({ box: 1, dueAtShiftIndex: 2, seen: 1, correct: 0 });
  });
  it('correct moves up one box, capped at 3 (due 4 shifts later)', () => {
    let m = recordResult({}, 'q1', true, 1);
    m = recordResult(m, 'q1', true, 3);
    expect(m.q1).toMatchObject({ box: 3, dueAtShiftIndex: 7 });
    m = recordResult(m, 'q1', true, 7);
    expect(m.q1).toMatchObject({ box: 3, dueAtShiftIndex: 11, seen: 3, correct: 3 });
  });
  it('wrong drops back to box 1', () => {
    let m = recordResult({}, 'q1', true, 1);
    m = recordResult(m, 'q1', false, 2);
    expect(m.q1).toMatchObject({ box: 1, dueAtShiftIndex: 3 });
  });
  it('does not mutate the input', () => {
    const m = {};
    recordResult(m, 'q1', true, 1);
    expect(m).toEqual({});
  });
});

describe('isDue', () => {
  it('is due when dueAtShiftIndex <= current shift', () => {
    const e = { box: 1 as const, dueAtShiftIndex: 2, seen: 1, correct: 0 };
    expect(isDue(e, 1)).toBe(false);
    expect(isDue(e, 2)).toBe(true);
  });
});

describe('recordShiftConcepts', () => {
  it('updates each concept once per shift; correct when accuracy ≥ 75%', () => {
    const m = recordShiftConcepts(
      {},
      [
        { conceptIds: ['url', 'phish'], correct: true },
        { conceptIds: ['url'], correct: true },
        { conceptIds: ['url'], correct: true },
        { conceptIds: ['url'], correct: false },
        { conceptIds: ['phish'], correct: false },
      ],
      1,
    );
    expect(m['concept:url']).toEqual({ box: 2, dueAtShiftIndex: 3, seen: 4, correct: 3 });
    expect(m['concept:phish']).toEqual({ box: 1, dueAtShiftIndex: 2, seen: 2, correct: 1 });
  });
});

describe('masteryOf', () => {
  it('is 0 for an unseen concept', () => {
    expect(masteryOf({}, 'url')).toBe(0);
  });
  it('combines accuracy and box', () => {
    const m = { 'concept:url': { box: 3 as const, dueAtShiftIndex: 5, seen: 4, correct: 4 } };
    expect(masteryOf(m, 'url')).toBe(1);
    const m2 = { 'concept:url': { box: 1 as const, dueAtShiftIndex: 2, seen: 4, correct: 2 } };
    expect(masteryOf(m2, 'url')).toBe(0.25);
  });
});
