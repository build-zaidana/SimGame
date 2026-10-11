import { describe, expect, it } from 'vitest';
import {
  canAdd,
  commitSprint,
  newProjectProgress,
  remainingCards,
  scoreBrief,
  scorePlan,
  sprintOutcome,
  sprintPlan,
  type ProjectCard,
} from '../project.ts';
import { startShift } from '../shift.ts';
import type { CaseOutcome, ShiftSession } from '../types.ts';

const card = (id: string, points: number, priority: ProjectCard['priority']): ProjectCard => ({
  id,
  points,
  priority,
  caseId: `case-${id}`,
});
const CARDS = [
  card('a', 3, 'must'),
  card('b', 2, 'should'),
  card('c', 2, 'must'),
  card('d', 1, 'could'),
];

describe('scoreBrief (sorting requirements before work starts)', () => {
  const items = [
    { id: 'r1', kind: 'clear' as const },
    { id: 'r2', kind: 'ambiguous' as const },
    { id: 'r3', kind: 'out-of-scope' as const },
    { id: 'r4', kind: 'clear' as const },
  ];
  it('scores the share of requirements sorted correctly and lists the wrong ones', () => {
    expect(
      scoreBrief(items, { r1: 'clear', r2: 'ambiguous', r3: 'out-of-scope', r4: 'clear' }),
    ).toEqual({ score: 1, wrong: [] });
    expect(scoreBrief(items, { r1: 'clear', r2: 'clear', r3: 'out-of-scope' })).toEqual({
      score: 0.5,
      wrong: ['r2', 'r4'],
    });
  });
});

describe('sprint planning', () => {
  it('only allows cards that fit the remaining capacity', () => {
    expect(canAdd([CARDS[0]!], CARDS[1]!, 5)).toBe(true);
    expect(canAdd([CARDS[0]!, CARDS[1]!], CARDS[3]!, 5)).toBe(false);
    expect(canAdd([CARDS[0]!], CARDS[0]!, 9)).toBe(false);
  });

  it('rewards taking every must-have that fits before nice-to-haves', () => {
    // Kapasitas 5: kedua must (3 + 2) muat → rencana ideal.
    expect(scorePlan(CARDS, [CARDS[0]!, CARDS[2]!], 5)).toBe(1);
    // Must "c" ditinggal demi should "b": hanya 3 dari 5 poin must.
    expect(scorePlan(CARDS, [CARDS[0]!, CARDS[1]!], 5)).toBeCloseTo(0.6);
    // Tanpa must tersisa, rencana apa pun yang terisi dinilai penuh; rencana kosong nol.
    const rest = [CARDS[1]!, CARDS[3]!];
    expect(scorePlan(rest, [CARDS[3]!], 3)).toBe(1);
    expect(scorePlan(rest, [], 3)).toBe(0);
  });

  it('does not punish a must that could never fit the capacity', () => {
    const big = [card('x', 8, 'must'), card('y', 2, 'should')];
    expect(scorePlan(big, [big[1]!], 5)).toBe(1);
  });

  it('lists cards not done yet, in content order', () => {
    const progress = { ...newProjectProgress(), doneCards: ['a', 'd'] };
    expect(remainingCards(CARDS, progress).map((c) => c.id)).toEqual(['b', 'c']);
  });
});

describe('a sprint as a desk shift', () => {
  const plan = sprintPlan({
    projectId: 'p1',
    modeId: 'dev',
    sprint: 2,
    level: 3,
    cards: [CARDS[0]!, CARDS[2]!],
    surprises: [{ caseId: 'surprise-1', arriveAt: 20 }],
    durationGameMinutes: 90,
    realSecondsPerGameMinute: 4,
  });

  it('puts every planned card on the board at the start and surprises later', () => {
    expect(plan.shiftId).toBe('p1-sprint-2');
    expect(plan.order).toBe(3);
    expect(plan.cases).toEqual([
      { caseId: 'case-a', arriveAt: 0 },
      { caseId: 'case-c', arriveAt: 0 },
      { caseId: 'surprise-1', arriveAt: 20 },
    ]);
  });

  it('counts a card done only when its task was solved correctly', () => {
    const session: ShiftSession = startShift({ plan, seed: 1, playMode: 'relaxed', trust: 75 });
    const decided = (id: string, correct: boolean) => ({
      status: 'decided' as const,
      outcome: { caseId: id, correct } as CaseOutcome,
    });
    const s: ShiftSession = {
      ...session,
      cases: session.cases.map((c) =>
        c.caseId === 'case-a'
          ? { ...c, ...decided('case-a', true) }
          : c.caseId === 'case-c'
            ? { ...c, ...decided('case-c', false) }
            : c,
      ),
    };
    const out = sprintOutcome(s, [CARDS[0]!, CARDS[2]!]);
    expect(out).toEqual({ done: ['a'], carried: ['c'], donePoints: 3, plannedPoints: 5 });

    const next = commitSprint(newProjectProgress(), out, 0.8);
    expect(next).toMatchObject({
      sprintsDone: 1,
      doneCards: ['a'],
      velocity: [3],
      planScores: [0.8],
    });
    // Sprint berikutnya menambah, tidak mengganti.
    const later = commitSprint(
      next,
      { done: ['c'], carried: [], donePoints: 2, plannedPoints: 2 },
      1,
    );
    expect(later).toMatchObject({ sprintsDone: 2, doneCards: ['a', 'c'], velocity: [3, 2] });
  });
});
