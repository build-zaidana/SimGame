import { describe, expect, it } from 'vitest';
import type { CaseCore } from '../../../engine/types.ts';
import { evaluateIncident, serverHealth } from '../incident.ts';

describe('serverHealth (server terbakar)', () => {
  it('drains with shift clock time since the case was opened', () => {
    expect(serverHealth({ openedAtMs: 1000, nowMs: 1000, drainPerSecond: 2 })).toBe(100);
    expect(serverHealth({ openedAtMs: 1000, nowMs: 11_000, drainPerSecond: 2 })).toBe(80);
    expect(serverHealth({ openedAtMs: 0, nowMs: 999_000, drainPerSecond: 2 })).toBe(0);
  });
  it('never drops below the floor (Santai mode)', () => {
    expect(serverHealth({ openedAtMs: 0, nowMs: 999_000, drainPerSecond: 2, floor: 35 })).toBe(35);
  });
  it('freezes at the moment of the emergency rollback', () => {
    expect(
      serverHealth({ openedAtMs: 0, nowMs: 60_000, rolledBackAtMs: 5000, drainPerSecond: 2 }),
    ).toBe(90);
  });
});

describe('evaluateIncident', () => {
  const c: CaseCore = {
    id: 'i-1',
    verdict: 'task',
    correctDecision: 'submit',
    acceptableDecisions: {},
    severity: 3,
    evidence: { required: [], supporting: [] },
  };
  const input = (nowMs: number, rolledBackAtMs?: number, passed = 3) => ({
    decision: 'submit',
    marks: [],
    answer: {
      text: 'x',
      runs: 2,
      passed,
      total: 3,
      ...(rolledBackAtMs !== undefined ? { rolledBackAtMs } : {}),
    },
    timing: { openedAtMs: 0, nowMs },
  });

  it('a quick full fix keeps a healthy server: correct, high score', () => {
    const o = evaluateIncident(c, 2, input(10_000));
    expect(o).toMatchObject({ correct: true, impact: 'correct', decisionScore: 1 });
    expect(o.evidenceScore).toBeCloseTo(0.8);
  });

  it('rolling back early protects the score even if the fix takes long', () => {
    const o = evaluateIncident(c, 2, input(200_000, 3000));
    expect(o.correct).toBe(true);
    expect(o.evidenceScore).toBeCloseTo(0.94);
  });

  it('letting the server go down hurts users even if the fix is right', () => {
    const o = evaluateIncident(c, 2, input(200_000));
    expect(o).toMatchObject({ correct: false, impact: 'threat-allowed' });
  });

  it('in Santai mode the clock never costs points: a slow full fix is fully correct', () => {
    const slow = { ...input(999_000), timing: { openedAtMs: 0, nowMs: 999_000, relaxed: true } };
    expect(evaluateIncident(c, 2, slow)).toMatchObject({
      correct: true,
      impact: 'correct',
      decisionScore: 1,
      evidenceScore: 1,
    });
  });

  it('failing tests stay partial or wrong like normal coding tasks', () => {
    expect(evaluateIncident(c, 2, input(5000, undefined, 1)).impact).toBe('partial');
    expect(evaluateIncident(c, 2, input(5000, undefined, 0)).impact).toBe('wrong');
  });
});
