import { describe, expect, it } from 'vitest';
import type { CaseCore, Verdict } from '../../../engine/types.ts';
import { evaluateSupportCase } from '../evaluate.ts';

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
  evidence: { required: ['symptom'], supporting: ['history'] },
  ...extra,
});

describe('evaluateSupportCase (Bengkel IT, ADR 025)', () => {
  it('scores the right decision with full evidence as correct', () => {
    const o = evaluateSupportCase(core('fault', 'replace'), {
      decision: 'replace',
      marks: ['symptom'],
    });
    expect(o).toMatchObject({
      correct: true,
      impact: 'correct',
      decisionScore: 1,
      evidenceScore: 1,
    });
  });

  it('leaving a real fault to the user ("guide") is the costly mistake', () => {
    for (const verdict of ['fault', 'specialist'] as const) {
      const o = evaluateSupportCase(core(verdict, 'fix'), { decision: 'guide', marks: [] });
      expect(o.impact).toBe('threat-allowed');
      expect(o.correct).toBe(false);
    }
  });

  it('repairing or replacing when nothing is broken wastes time and parts', () => {
    for (const decision of ['fix', 'replace']) {
      const o = evaluateSupportCase(core('no-fault', 'guide'), { decision, marks: [] });
      expect(o.impact).toBe('legit-blocked');
    }
  });

  it('escalating a no-fault ticket bothers specialists for nothing', () => {
    const o = evaluateSupportCase(core('no-fault', 'guide'), { decision: 'escalate', marks: [] });
    expect(o.impact).toBe('needless-escalation');
  });

  it('a partly right decision on a real fault keeps partial credit', () => {
    const c = core('specialist', 'escalate', { acceptableDecisions: { fix: 0.6 } });
    const partial = evaluateSupportCase(c, { decision: 'fix', marks: ['symptom'] });
    expect(partial).toMatchObject({ impact: 'partial', decisionScore: 0.6, correct: false });
    const wrong = evaluateSupportCase(c, { decision: 'replace', marks: [] });
    expect(wrong).toMatchObject({ impact: 'wrong', decisionScore: 0 });
  });
});
