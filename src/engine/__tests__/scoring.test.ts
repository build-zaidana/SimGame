import { describe, expect, it } from 'vitest';
import { caseScore, scoreDecision, scoreEvidence, shiftStars, timeBonus } from '../scoring.ts';
import type { CaseCore } from '../types.ts';

const core: CaseCore = {
  id: 'c1',
  verdict: 'malicious',
  correctDecision: 'block',
  acceptableDecisions: { escalate: 0.6 },
  severity: 2,
  evidence: { required: ['sender', 'link'], supporting: ['urgency', 'greeting'] },
};

describe('scoreDecision', () => {
  it('gives 1 for the correct decision', () => {
    expect(scoreDecision(core, 'block')).toBe(1);
  });
  it('gives the acceptable weight', () => {
    expect(scoreDecision(core, 'escalate')).toBe(0.6);
  });
  it('gives 0 otherwise', () => {
    expect(scoreDecision(core, 'allow')).toBe(0);
  });
});

describe('scoreEvidence', () => {
  const ev = core.evidence;
  it('is 1 when all required evidence is marked', () => {
    expect(scoreEvidence(ev, ['sender', 'link']).score).toBe(1);
  });
  it('is recall of required evidence', () => {
    const r = scoreEvidence(ev, ['sender']);
    expect(r.score).toBe(0.5);
    expect(r.missed).toEqual(['link']);
  });
  it('subtracts 0.25 per wrong mark', () => {
    const r = scoreEvidence(ev, ['sender', 'link', 'body-1']);
    expect(r.score).toBe(0.75);
    expect(r.wrong).toEqual(['body-1']);
  });
  it('adds 0.05 per supporting mark', () => {
    expect(scoreEvidence(ev, ['sender', 'urgency'])).toMatchObject({ score: 0.55 });
  });
  it('clamps to [0, 1]', () => {
    expect(scoreEvidence(ev, ['sender', 'link', 'urgency']).score).toBe(1);
    expect(scoreEvidence(ev, ['x', 'y', 'z']).score).toBe(0);
  });
  it('safe case with no required evidence scores 1 when nothing wrong is marked', () => {
    const safe = { required: [], supporting: ['sender'] };
    expect(scoreEvidence(safe, []).score).toBe(1);
    expect(scoreEvidence(safe, ['sender']).score).toBe(1);
    expect(scoreEvidence(safe, ['link']).score).toBe(0.75);
  });
});

describe('caseScore', () => {
  it('perfect decision and evidence = 100', () => {
    expect(caseScore({ decisionScore: 1, evidenceScore: 1, hintsUsed: 0, timeBonus: 0 })).toBe(100);
  });
  it('halves evidence weight when the decision is wrong', () => {
    expect(caseScore({ decisionScore: 0, evidenceScore: 1, hintsUsed: 0, timeBonus: 0 })).toBe(20);
  });
  it('acceptable decision', () => {
    expect(caseScore({ decisionScore: 0.6, evidenceScore: 0.5, hintsUsed: 0, timeBonus: 0 })).toBe(
      56,
    );
  });
  it('first hint is free, each later hint costs 10', () => {
    const base = { decisionScore: 1, evidenceScore: 1, timeBonus: 0 };
    expect(caseScore({ ...base, hintsUsed: 1 })).toBe(100);
    expect(caseScore({ ...base, hintsUsed: 3 })).toBe(80);
  });
  it('adds time bonus and clamps to [0, 100]', () => {
    expect(caseScore({ decisionScore: 0.6, evidenceScore: 1, hintsUsed: 0, timeBonus: 10 })).toBe(
      86,
    );
    expect(caseScore({ decisionScore: 1, evidenceScore: 1, hintsUsed: 0, timeBonus: 10 })).toBe(
      100,
    );
    expect(caseScore({ decisionScore: 0, evidenceScore: 0, hintsUsed: 5, timeBonus: 0 })).toBe(0);
  });
});

describe('timeBonus', () => {
  it('is 0 in relaxed mode', () => {
    expect(timeBonus('relaxed', 1, 1000)).toBe(0);
  });
  it('is 0 when the decision is not fully correct', () => {
    expect(timeBonus('normal', 0.6, 1000)).toBe(0);
  });
  it('decays from 10 to 0 over 60 seconds', () => {
    expect(timeBonus('normal', 1, 0)).toBe(10);
    expect(timeBonus('normal', 1, 30_000)).toBe(5);
    expect(timeBonus('normal', 1, 90_000)).toBe(0);
  });
});

describe('shiftStars', () => {
  it.each([
    [40, 90, 0],
    [50, 90, 1],
    [70, 90, 2],
    [85, 70, 3],
    [90, 69, 2],
  ])('avg %i, trust %i → %i stars', (avg, trust, stars) => {
    expect(shiftStars(avg, trust)).toBe(stars);
  });
});
