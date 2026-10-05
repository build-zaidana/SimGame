import { describe, expect, it } from 'vitest';
import type { CaseCore, Verdict } from '../../../engine/types.ts';
import { evaluateCodingCase, evaluateDevCase, evaluateFlag } from '../evaluate.ts';

const core = (
  verdict: Verdict,
  correctDecision: string,
  extra: Partial<CaseCore> = {},
): CaseCore => ({
  id: 'c-1',
  verdict,
  correctDecision,
  acceptableDecisions: {},
  severity: 2,
  evidence: { required: ['bug-line'], supporting: ['test'] },
  ...extra,
});

describe('evaluateDevCase (Meja Developer, ADR 026)', () => {
  it('scores the right decision with full evidence as correct', () => {
    const o = evaluateDevCase(core('fault', 'revise'), { decision: 'revise', marks: ['bug-line'] });
    expect(o).toMatchObject({
      correct: true,
      impact: 'correct',
      decisionScore: 1,
      evidenceScore: 1,
    });
  });

  it('approving buggy or dangerous code ships the problem (costliest mistake)', () => {
    for (const verdict of ['fault', 'specialist'] as const) {
      const o = evaluateDevCase(core(verdict, 'revise'), { decision: 'approve', marks: [] });
      expect(o.impact).toBe('threat-allowed');
    }
  });

  it('sending correct code back or rolling back a healthy release blocks good work', () => {
    for (const decision of ['revise', 'rollback']) {
      const o = evaluateDevCase(core('no-fault', 'approve'), { decision, marks: [] });
      expect(o.impact).toBe('legit-blocked');
    }
  });

  it('escalating correct code bothers seniors for nothing', () => {
    const o = evaluateDevCase(core('no-fault', 'approve'), { decision: 'escalate', marks: [] });
    expect(o.impact).toBe('needless-escalation');
  });

  it('a partly right decision on a real problem keeps partial credit', () => {
    const c = core('fault', 'rollback', { acceptableDecisions: { escalate: 0.5 } });
    expect(evaluateDevCase(c, { decision: 'escalate', marks: [] })).toMatchObject({
      impact: 'partial',
      decisionScore: 0.5,
    });
    expect(evaluateDevCase(c, { decision: 'revise', marks: [] }).impact).toBe('wrong');
  });
});

describe('evaluateCodingCase (tugas coding)', () => {
  const task = core('task', 'submit', { evidence: { required: [], supporting: [] } });
  const answer = (passed: number, total: number, runs: number) => ({
    text: 'x',
    runs,
    passed,
    total,
  });

  it('all tests green in few runs is a perfect solve', () => {
    const o = evaluateCodingCase(task, { decision: 'submit', marks: [], answer: answer(4, 4, 2) });
    expect(o).toMatchObject({
      correct: true,
      impact: 'correct',
      decisionScore: 1,
      evidenceScore: 1,
    });
  });

  it('many runs lower the efficiency part of the score, never below half', () => {
    const o = evaluateCodingCase(task, { decision: 'submit', marks: [], answer: answer(4, 4, 5) });
    expect(o.evidenceScore).toBeCloseTo(0.7);
    const slow = evaluateCodingCase(task, {
      decision: 'submit',
      marks: [],
      answer: answer(4, 4, 30),
    });
    expect(slow.evidenceScore).toBe(0.5);
  });

  it('some tests green is partial; none or never run is wrong', () => {
    expect(
      evaluateCodingCase(task, { decision: 'submit', marks: [], answer: answer(3, 4, 1) }),
    ).toMatchObject({ correct: false, impact: 'partial', decisionScore: 0.75 });
    expect(evaluateCodingCase(task, { decision: 'submit', marks: [] })).toMatchObject({
      impact: 'wrong',
      decisionScore: 0,
    });
  });
});

describe('evaluateFlag (CTF)', () => {
  const ctf = core('task', 'submit', { evidence: { required: [], supporting: [] } });
  it('accepts the exact flag, ignoring surrounding spaces', () => {
    const o = evaluateFlag(ctf, 'FLAG{halo}', {
      decision: 'submit',
      marks: [],
      answer: { text: '  FLAG{halo} ', runs: 1 },
    });
    expect(o).toMatchObject({ correct: true, impact: 'correct', evidenceScore: 1 });
  });
  it('rejects a different flag', () => {
    const o = evaluateFlag(ctf, 'FLAG{halo}', {
      decision: 'submit',
      marks: [],
      answer: { text: 'FLAG{hallo}', runs: 3 },
    });
    expect(o).toMatchObject({ correct: false, impact: 'wrong', decisionScore: 0 });
  });
});
