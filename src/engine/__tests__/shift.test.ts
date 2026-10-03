import { describe, expect, it } from 'vitest';
import { shiftReducer, startShift, summarizeShift, type ShiftAction } from '../shift.ts';
import type { CaseOutcome, ShiftPlan, ShiftSession } from '../types.ts';

const plan: ShiftPlan = {
  shiftId: 'soc-01',
  modeId: 'soc',
  order: 1,
  durationGameMinutes: 10,
  realSecondsPerGameMinute: 1,
  cases: [
    { caseId: 'b', arriveAt: 5 },
    { caseId: 'a', arriveAt: 0 },
    { caseId: 'c', arriveAt: 8 },
  ],
};

const start = (playMode: 'relaxed' | 'normal' = 'relaxed') =>
  startShift({ plan, seed: 42, playMode, trust: 75 });

const run = (s: ShiftSession, ...actions: ShiftAction[]) => actions.reduce(shiftReducer, s);

function outcome(caseId: string, over: Partial<CaseOutcome> = {}): CaseOutcome {
  return {
    caseId,
    decision: 'block',
    verdict: 'malicious',
    severity: 2,
    impact: 'correct',
    correct: true,
    decisionScore: 1,
    evidenceScore: 1,
    missedEvidence: [],
    wrongMarks: [],
    ...over,
  };
}

const working = () => run(start(), { type: 'DISMISS_BRIEFING' });
const decide = (caseId: string, over: Partial<CaseOutcome> = {}): ShiftAction[] => [
  { type: 'OPEN_CASE', caseId },
  { type: 'DECIDE', outcome: outcome(caseId, over) },
  { type: 'CLOSE_FEEDBACK' },
];

describe('startShift', () => {
  it('creates a briefing session sorted by arrival, with t=0 cases arrived', () => {
    const s = start();
    expect(s.phase).toBe('briefing');
    expect(s.cases.map((c) => c.caseId)).toEqual(['a', 'b', 'c']);
    expect(s.cases.map((c) => c.status)).toEqual(['arrived', 'pending', 'pending']);
    expect(s.durationMs).toBe(10_000);
    expect(s.cases[1]?.arriveAtMs).toBe(5000);
    expect(s.trust).toBe(75);
  });

  it('keeps generated case data opaque in the session', () => {
    const s = startShift({
      plan,
      seed: 1,
      playMode: 'relaxed',
      trust: 75,
      generatedCases: { c: { any: 'data' } },
    });
    expect(s.generatedCases).toEqual({ c: { any: 'data' } });
    expect(start().generatedCases).toEqual({});
  });

  it('is JSON-serializable without loss', () => {
    const s = run(working(), { type: 'OPEN_CASE', caseId: 'a' });
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });

  it('START_SHIFT action replaces any session', () => {
    const s = shiftReducer(working(), {
      type: 'START_SHIFT',
      plan,
      seed: 1,
      playMode: 'normal',
      trust: 50,
    });
    expect(s).toMatchObject({ phase: 'briefing', seed: 1, playMode: 'normal', trust: 50 });
  });
});

describe('clock', () => {
  it('does not tick during briefing or while paused', () => {
    expect(run(start(), { type: 'TICK', dtMs: 1000 }).elapsedMs).toBe(0);
    const paused = run(working(), { type: 'PAUSE' }, { type: 'TICK', dtMs: 1000 });
    expect(paused.elapsedMs).toBe(0);
    expect(run(paused, { type: 'RESUME' }, { type: 'TICK', dtMs: 1000 }).elapsedMs).toBe(1000);
  });

  it('cases arrive when the clock reaches them', () => {
    const s = run(working(), { type: 'TICK', dtMs: 5000 });
    expect(s.cases.find((c) => c.caseId === 'b')?.status).toBe('arrived');
    expect(s.cases.find((c) => c.caseId === 'c')?.status).toBe('pending');
  });

  it('normal mode: time up ends the shift and marks undecided cases missed', () => {
    const s = run(start('normal'), { type: 'DISMISS_BRIEFING' }, { type: 'TICK', dtMs: 20_000 });
    expect(s.phase).toBe('ended');
    expect(s.elapsedMs).toBe(10_000);
    expect(s.cases.every((c) => c.status === 'missed')).toBe(true);
  });

  it('relaxed mode: time up brings in all cases but does not end the shift', () => {
    const s = run(working(), { type: 'TICK', dtMs: 20_000 });
    expect(s.phase).toBe('working');
    expect(s.elapsedMs).toBe(10_000);
    expect(s.cases.every((c) => c.status === 'arrived')).toBe(true);
  });
});

describe('case flow', () => {
  it('OPEN_CASE only opens arrived cases', () => {
    expect(run(working(), { type: 'OPEN_CASE', caseId: 'b' }).activeCaseId).toBeNull();
    const s = run(working(), { type: 'OPEN_CASE', caseId: 'a' });
    expect(s.phase).toBe('inspecting');
    expect(s.activeCaseId).toBe('a');
    expect(s.cases[0]?.openedAtMs).toBe(0);
  });

  it('TOGGLE_MARK toggles evidence on the active case', () => {
    let s = run(
      working(),
      { type: 'OPEN_CASE', caseId: 'a' },
      { type: 'TOGGLE_MARK', evidenceId: 'x' },
    );
    expect(s.cases[0]?.marks).toEqual(['x']);
    s = run(s, { type: 'TOGGLE_MARK', evidenceId: 'y' }, { type: 'TOGGLE_MARK', evidenceId: 'x' });
    expect(s.cases[0]?.marks).toEqual(['y']);
  });

  it('TOGGLE_MARK and USE_HINT are ignored without an active case', () => {
    const s = working();
    expect(run(s, { type: 'TOGGLE_MARK', evidenceId: 'x' })).toBe(s);
    expect(run(s, { type: 'USE_HINT' })).toBe(s);
  });

  it('USE_HINT counts hints', () => {
    const s = run(
      working(),
      { type: 'OPEN_CASE', caseId: 'a' },
      { type: 'USE_HINT' },
      { type: 'USE_HINT' },
    );
    expect(s.cases[0]?.hintsUsed).toBe(2);
  });

  it('DECIDE scores the case, updates trust and shows feedback', () => {
    const s = run(
      working(),
      { type: 'OPEN_CASE', caseId: 'a' },
      {
        type: 'DECIDE',
        outcome: outcome('a', {
          impact: 'threat-allowed',
          decisionScore: 0,
          correct: false,
          evidenceScore: 0,
        }),
      },
    );
    expect(s.phase).toBe('feedback');
    expect(s.feedbackCaseId).toBe('a');
    expect(s.cases[0]).toMatchObject({ status: 'decided', score: 0 });
    expect(s.trust).toBe(65);
  });

  it('DECIDE applies hint penalty', () => {
    const s = run(
      working(),
      { type: 'OPEN_CASE', caseId: 'a' },
      { type: 'USE_HINT' },
      { type: 'USE_HINT' },
      { type: 'DECIDE', outcome: outcome('a') },
    );
    expect(s.cases[0]?.score).toBe(90);
  });

  it('DECIDE gives a time bonus only in normal mode', () => {
    const normal = run(
      start('normal'),
      { type: 'DISMISS_BRIEFING' },
      { type: 'OPEN_CASE', caseId: 'a' },
      {
        type: 'DECIDE',
        outcome: outcome('a', { decisionScore: 0.6, correct: false, impact: 'partial' }),
      },
    );
    expect(normal.cases[0]?.score).toBe(76);
  });

  it('DECIDE is ignored for a case that is not active', () => {
    const s = run(working(), { type: 'OPEN_CASE', caseId: 'a' });
    expect(run(s, { type: 'DECIDE', outcome: outcome('b') })).toBe(s);
  });

  it('CLOSE_FEEDBACK fast-forwards the clock when the queue is empty', () => {
    const s = run(working(), ...decide('a'));
    expect(s.phase).toBe('working');
    expect(s.activeCaseId).toBeNull();
    expect(s.elapsedMs).toBe(5000);
    expect(s.cases[1]?.status).toBe('arrived');
  });

  it('the shift ends after the last case is decided', () => {
    const s = run(working(), ...decide('a'), ...decide('b'), ...decide('c'));
    expect(s.phase).toBe('ended');
    expect(s.cases.every((c) => c.status === 'decided')).toBe(true);
  });

  it('END_SHIFT ends immediately and marks undecided cases missed', () => {
    const s = run(working(), ...decide('a'), { type: 'END_SHIFT' });
    expect(s.phase).toBe('ended');
    expect(s.cases.map((c) => c.status)).toEqual(['decided', 'missed', 'missed']);
  });

  it('ignores actions after the shift has ended', () => {
    const s = run(working(), { type: 'END_SHIFT' });
    expect(run(s, { type: 'OPEN_CASE', caseId: 'a' })).toBe(s);
    expect(run(s, { type: 'TICK', dtMs: 100 })).toBe(s);
  });
});

describe('summarizeShift', () => {
  it('averages scores (missed = 0), counts correct, computes pay and stars', () => {
    const s = run(
      working(),
      ...decide('a'),
      ...decide('b', { decisionScore: 0, evidenceScore: 0, correct: false, impact: 'wrong' }),
      { type: 'END_SHIFT' },
    );
    const sum = summarizeShift(s, { base: 100, perCorrect: 10 });
    expect(sum).toMatchObject({
      averageScore: 33,
      correctCount: 1,
      decidedCount: 2,
      totalCount: 3,
      pay: 110,
      stars: 0,
      trust: 76,
    });
  });
});
