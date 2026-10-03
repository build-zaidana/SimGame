import { describe, expect, it } from 'vitest';
import type { CaseCore } from '../../../engine/types.ts';
import { evaluateSocCase } from '../evaluate.ts';

const malicious: CaseCore = {
  id: 'm1',
  verdict: 'malicious',
  correctDecision: 'block',
  acceptableDecisions: { escalate: 0.6 },
  severity: 2,
  evidence: { required: ['sender', 'link'], supporting: ['urgency'] },
};

const safe: CaseCore = {
  id: 's1',
  verdict: 'safe',
  correctDecision: 'allow',
  acceptableDecisions: {},
  severity: 1,
  evidence: { required: [], supporting: ['sender'] },
};

describe('evaluateSocCase', () => {
  it('correct block with full evidence', () => {
    expect(evaluateSocCase(malicious, { decision: 'block', marks: ['sender', 'link'] })).toEqual({
      caseId: 'm1',
      decision: 'block',
      verdict: 'malicious',
      severity: 2,
      impact: 'correct',
      correct: true,
      decisionScore: 1,
      evidenceScore: 1,
      missedEvidence: [],
      wrongMarks: [],
    });
  });

  it('allowing a threat → threat-allowed', () => {
    const o = evaluateSocCase(malicious, { decision: 'allow', marks: [] });
    expect(o).toMatchObject({ impact: 'threat-allowed', correct: false, decisionScore: 0 });
    expect(o.missedEvidence).toEqual(['sender', 'link']);
  });

  it('escalating a threat is partial credit', () => {
    expect(evaluateSocCase(malicious, { decision: 'escalate', marks: ['sender'] })).toMatchObject({
      impact: 'partial',
      correct: false,
      decisionScore: 0.6,
      evidenceScore: 0.5,
    });
  });

  it('blocking a legit item → legit-blocked', () => {
    expect(evaluateSocCase(safe, { decision: 'block', marks: [] })).toMatchObject({
      impact: 'legit-blocked',
      decisionScore: 0,
    });
  });

  it('escalating a legit item → needless-escalation', () => {
    expect(evaluateSocCase(safe, { decision: 'escalate', marks: [] }).impact).toBe(
      'needless-escalation',
    );
  });

  it('allowing a legit item while marking unrelated parts keeps decision but lowers evidence', () => {
    expect(evaluateSocCase(safe, { decision: 'allow', marks: ['link'] })).toMatchObject({
      impact: 'correct',
      evidenceScore: 0.75,
      wrongMarks: ['link'],
    });
  });

  it('suspicious case allowed counts as threat-allowed', () => {
    const sus: CaseCore = {
      ...malicious,
      verdict: 'suspicious',
      correctDecision: 'escalate',
      acceptableDecisions: { block: 0.6 },
    };
    expect(evaluateSocCase(sus, { decision: 'allow', marks: [] }).impact).toBe('threat-allowed');
    expect(evaluateSocCase(sus, { decision: 'escalate', marks: [] }).impact).toBe('correct');
  });
});
