import { describe, expect, it } from 'vitest';
import { bossState } from '../boss.ts';
import { shiftReducer, startShift, summarizeShift, type ShiftAction } from '../shift.ts';
import type { CaseOutcome, PlayMode, ShiftPlan, ShiftSession } from '../types.ts';

// 1 menit game = 1 detik nyata.
const plan: ShiftPlan = {
  shiftId: 'soc-01',
  modeId: 'soc',
  order: 1,
  durationGameMinutes: 100,
  realSecondsPerGameMinute: 1,
  cases: [
    { caseId: 'a', arriveAt: 0 },
    { caseId: 'b', arriveAt: 20 },
    { caseId: 'c', arriveAt: 70 },
    { caseId: 'd', arriveAt: 80 },
  ],
  boss: { caseIds: ['b', 'c', 'd'], arriveAt: 40, durationGameMinutes: 30, reward: 50 },
};

const run = (s: ShiftSession, ...actions: ShiftAction[]) => actions.reduce(shiftReducer, s);
const start = (playMode: PlayMode = 'normal') =>
  run(startShift({ plan, seed: 1, playMode, trust: 75 }), { type: 'DISMISS_BRIEFING' });

function outcome(caseId: string, correct = true): CaseOutcome {
  return {
    caseId,
    decision: 'block',
    verdict: 'malicious',
    severity: 1,
    impact: correct ? 'correct' : 'partial',
    correct,
    decisionScore: correct ? 1 : 0.5,
    evidenceScore: 1,
    missedEvidence: [],
    wrongMarks: [],
  };
}
const decide = (caseId: string, correct = true): ShiftAction[] => [
  { type: 'OPEN_CASE', caseId },
  { type: 'DECIDE', outcome: outcome(caseId, correct) },
  { type: 'CLOSE_FEEDBACK' },
];

describe('boss wave', () => {
  it('makes every boss case arrive together when the boss starts', () => {
    const s = start();
    expect(
      s.cases.filter((c) => s.boss?.caseIds.includes(c.caseId)).map((c) => c.arriveAtMs),
    ).toEqual([40_000, 40_000, 40_000]);
    expect(s.boss).toEqual({
      caseIds: ['b', 'c', 'd'],
      startsAtMs: 40_000,
      endsAtMs: 70_000,
      reward: 50,
    });
  });

  it('is pending, then active with full HP', () => {
    const s = start();
    expect(bossState(s)).toMatchObject({ status: 'pending', hp: 3, maxHp: 3 });
    const active = run(s, ...decide('a'));
    // Antrian kosong: jam melompat ke kedatangan boss.
    expect(active.elapsedMs).toBe(40_000);
    expect(bossState(active)).toMatchObject({ status: 'active', hp: 3, msLeft: 30_000 });
  });

  it('loses HP on correct decisions and is defeated when all are correct', () => {
    let s = run(start(), ...decide('a'), ...decide('b'));
    expect(bossState(s)).toMatchObject({ status: 'active', hp: 2 });
    s = run(s, ...decide('c'), ...decide('d'));
    expect(bossState(s)?.status).toBe('defeated');
    expect(summarizeShift(s, { base: 10, perCase: 0 }).bossBonus).toBe(50);
    expect(summarizeShift(s, { base: 10, perCase: 0 }).pay).toBe(60);
  });

  it('escapes after one wrong decision, without a bonus', () => {
    const s = run(start(), ...decide('a'), ...decide('b', false));
    expect(bossState(s)).toMatchObject({ status: 'escaped', hp: 3 });
    expect(summarizeShift(s, { base: 10, perCase: 0 }).bossBonus).toBe(0);
  });

  it('in normal mode, time running out misses the open boss cases and closes the one being read', () => {
    let s = run(start(), ...decide('a'), ...decide('b'), { type: 'OPEN_CASE', caseId: 'c' });
    s = run(s, { type: 'TICK', dtMs: 30_000 });
    expect(bossState(s)?.status).toBe('escaped');
    expect(s.cases.filter((c) => ['c', 'd'].includes(c.caseId)).map((c) => c.status)).toEqual([
      'missed',
      'missed',
    ]);
    expect(s.activeCaseId).toBeNull();
    // Semua kasus beres → shift selesai.
    expect(s.phase).toBe('ended');
  });

  it('has no time limit in relaxed mode', () => {
    const s = run(start('relaxed'), ...decide('a'), { type: 'TICK', dtMs: 45_000 });
    expect(bossState(s)?.status).toBe('active');
    expect(s.cases.find((c) => c.caseId === 'b')?.status).toBe('arrived');
  });

  it('is absent for shifts without a boss and for old sessions', () => {
    const { boss: _none, ...plain } = plan;
    const s = startShift({ plan: plain, seed: 1, playMode: 'normal', trust: 75 });
    expect(s.boss).toBeUndefined();
    expect(bossState(s)).toBeNull();
    expect(summarizeShift(s, { base: 10, perCase: 0 }).bossBonus).toBe(0);
  });
});
