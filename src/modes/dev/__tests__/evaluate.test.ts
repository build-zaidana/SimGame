import { describe, expect, it } from 'vitest';
import type { CaseCore, Verdict } from '../../../engine/types.ts';
import { evaluateDevCase } from '../evaluate.ts';

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
