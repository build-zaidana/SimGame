import { describe, expect, it } from 'vitest';
import type { ProjectDef } from '../../content/schemas.ts';
import { startShift } from '../../engine/shift.ts';
import type { CaseOutcome, ShiftSession } from '../../engine/types.ts';
import { createNewSave, newModeProgress, type SaveData } from '../../persistence/saveSchema.ts';
import { commitBrief, commitProjectSprint, projectStep, startSprint } from '../projects.ts';

const project: ProjectDef = {
  id: 'p-1',
  title: 'Aplikasi antrean',
  client: { name: 'Toko Kopi Senja', team: 'Klien' },
  unlockAfterShift: 2,
  level: 3,
  terms: { sprint: 'Sprint', columns: { todo: 'To Do', doing: 'Dikerjakan', done: 'Selesai' } },
  brief: {
    title: 'PRD',
    intro: ['Halo.'],
    items: [
      { id: 'b-1', text: 'A', kind: 'clear', why: 'x' },
      { id: 'b-2', text: 'B', kind: 'ambiguous', why: 'x' },
      { id: 'b-3', text: 'C', kind: 'out-of-scope', why: 'x' },
    ],
  },
  cards: [
    { id: 'k-1', title: 'A', story: 's', points: 3, priority: 'must', caseId: 'c-1' },
    { id: 'k-2', title: 'B', story: 's', points: 2, priority: 'must', caseId: 'c-2' },
    { id: 'k-3', title: 'C', story: 's', points: 2, priority: 'could', caseId: 'c-3' },
  ],
  sprints: [
    { goal: 'G1', capacity: 3, surprises: [{ caseId: 'c-9', arriveAt: 10 }] },
    { goal: 'G2', capacity: 4, surprises: [] },
  ],
  durationGameMinutes: 60,
  realSecondsPerGameMinute: 4,
  pay: { perPoint: 10, completion: 50 },
  sources: ['Scrum Guide'],
};

const save = (unlockedShift: number): SaveData => ({
  ...createNewSave({ installId: 'x', now: '2026-10-11T08:00:00.000Z' }),
  modes: { dev: { ...newModeProgress(), unlockedShift, wallet: 100 } },
});

const finish = (session: ShiftSession, correct: string[]): ShiftSession => ({
  ...session,
  phase: 'ended',
  cases: session.cases.map((c) => ({
    ...c,
    status: 'decided',
    outcome: { caseId: c.caseId, correct: correct.includes(c.caseId) } as CaseOutcome,
  })),
});

describe('client project flow (ADR 032)', () => {
  it('opens after the required shift, starting with the brief', () => {
    expect(projectStep(project, save(2).modes['dev'])).toEqual({ kind: 'locked', afterShift: 2 });
    expect(projectStep(project, save(3).modes['dev'])).toEqual({ kind: 'brief' });
    const briefed = commitBrief(save(3), 'dev', 'p-1', 2 / 3, 'now');
    expect(briefed.modes['dev']?.projects['p-1']?.briefScore).toBeCloseTo(2 / 3);
    expect(projectStep(project, briefed.modes['dev'])).toEqual({ kind: 'planning', sprint: 1 });
  });

  it('turns the planned cards into a sprint session and pays per finished point', () => {
    let s = commitBrief(save(3), 'dev', 'p-1', 1, 'now');
    const plan = startSprint(project, 'dev', s.modes['dev']!, ['k-1']);
    expect(plan.marker).toEqual({ projectId: 'p-1', sprint: 1, cardIds: ['k-1'], planScore: 1 });
    expect(plan.plan.cases.map((c) => c.caseId)).toEqual(['c-1', 'c-9']);

    const session = {
      ...startShift({ plan: plan.plan, seed: 1, playMode: 'relaxed', trust: 75 }),
      project: plan.marker,
    };
    s = { ...s, modes: { dev: { ...s.modes['dev']!, practiceSession: session } } };
    const r = commitProjectSprint(s, finish(session, ['c-1']), project, 'later');
    expect(r.outcome).toMatchObject({ done: ['k-1'], donePoints: 3 });
    expect(r.pay).toBe(30);
    expect(r.completed).toBe(false);
    expect(r.save.modes['dev']?.wallet).toBe(130);
    expect(r.save.modes['dev']?.practiceSession).toBeUndefined();
    expect(projectStep(project, r.save.modes['dev'])).toEqual({ kind: 'planning', sprint: 2 });
  });

  it('finishes the project after the last sprint with a completion bonus', () => {
    let s = commitBrief(save(3), 'dev', 'p-1', 1, 'now');
    const p = s.modes['dev']!;
    s = {
      ...s,
      modes: {
        dev: {
          ...p,
          projects: {
            'p-1': {
              ...p.projects['p-1']!,
              sprintsDone: 1,
              doneCards: ['k-1'],
              velocity: [3],
              planScores: [1],
            },
          },
        },
      },
    };
    const plan = startSprint(project, 'dev', s.modes['dev']!, ['k-2', 'k-3']);
    expect(plan.marker.sprint).toBe(2);
    const session = {
      ...startShift({ plan: plan.plan, seed: 2, playMode: 'relaxed', trust: 75 }),
      project: plan.marker,
    };
    const r = commitProjectSprint(s, finish(session, ['c-2']), project, 'later');
    expect(r).toMatchObject({ completed: true, pay: 20 + 50 });
    expect(r.save.modes['dev']?.projects['p-1']).toMatchObject({
      sprintsDone: 2,
      completedAt: 'later',
    });
    expect(projectStep(project, r.save.modes['dev'])).toEqual({ kind: 'done' });
  });
});
