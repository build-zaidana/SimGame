import { describe, expect, it } from 'vitest';
import type { CaseCore, Verdict } from '../../../engine/types.ts';
import { evaluateDataCase, evaluateQueryCase } from '../evaluate.ts';

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
  evidence: { required: ['axis'], supporting: ['note'] },
  ...extra,
});

describe('evaluateDataCase (Meja Data, ADR 031)', () => {
  it('scores the right decision with full evidence as correct', () => {
    const o = evaluateDataCase(core('fault', 'revise'), { decision: 'revise', marks: ['axis'] });
    expect(o).toMatchObject({
      correct: true,
      impact: 'correct',
      decisionScore: 1,
      evidenceScore: 1,
    });
  });

  it('approving a misleading chart or a risky data request is the costliest mistake', () => {
    for (const verdict of ['fault', 'specialist'] as const) {
      const o = evaluateDataCase(core(verdict, 'revise'), { decision: 'approve', marks: [] });
      expect(o.impact).toBe('threat-allowed');
    }
  });

  it('sending back an honest report blocks good work; escalating it bothers others', () => {
    expect(
      evaluateDataCase(core('no-fault', 'approve'), { decision: 'revise', marks: [] }).impact,
    ).toBe('legit-blocked');
    expect(
      evaluateDataCase(core('no-fault', 'approve'), { decision: 'escalate', marks: [] }).impact,
    ).toBe('needless-escalation');
  });

  it('a partly right decision keeps partial credit', () => {
    const c = core('specialist', 'escalate', { acceptableDecisions: { revise: 0.5 } });
    expect(evaluateDataCase(c, { decision: 'revise', marks: [] })).toMatchObject({
      impact: 'partial',
      decisionScore: 0.5,
    });
  });
});

describe('evaluateQueryCase (tugas SQL)', () => {
  const task = core('task', 'submit', { evidence: { required: [], supporting: [] } });

  it('scores the share of datasets where the query result matched', () => {
    const o = evaluateQueryCase(task, {
      decision: 'submit',
      marks: [],
      answer: { text: 'SELECT 1', runs: 1, passed: 2, total: 2 },
    });
    expect(o).toMatchObject({
      correct: true,
      impact: 'correct',
      decisionScore: 1,
      evidenceScore: 1,
    });
  });

  it('a query that only works on the visible data gets partial credit', () => {
    const o = evaluateQueryCase(task, {
      decision: 'submit',
      marks: [],
      answer: { text: 'x', runs: 5, passed: 1, total: 2 },
    });
    expect(o).toMatchObject({ correct: false, impact: 'partial', decisionScore: 0.5 });
    // Banyak percobaan menurunkan efisiensi, tapi tidak di bawah 0,5.
    expect(o.evidenceScore).toBeCloseTo(0.7);
  });

  it('a query that was never run scores zero', () => {
    const o = evaluateQueryCase(task, { decision: 'submit', marks: [] });
    expect(o).toMatchObject({ impact: 'wrong', decisionScore: 0 });
  });
});
