import { describe, expect, it } from 'vitest';
import {
  badgeEarned,
  currentStreak,
  newBadges,
  type BadgeContext,
  type BadgeRule,
} from '../badges.ts';
import type { CaseImpact, CaseOutcome, SessionCase } from '../types.ts';

let opened = 0;
function decided(
  impact: CaseImpact,
  over: Partial<CaseOutcome> = {},
  caseOver: Partial<SessionCase> = {},
): SessionCase {
  opened += 1000;
  const correct = impact === 'correct';
  return {
    caseId: `c${opened}`,
    arriveAtMs: 0,
    status: 'decided',
    marks: [],
    hintsUsed: 0,
    openedAtMs: opened,
    score: correct ? 100 : 0,
    outcome: {
      caseId: `c${opened}`,
      decision: correct ? 'block' : 'allow',
      verdict:
        impact === 'legit-blocked' || impact === 'needless-escalation' ? 'safe' : 'malicious',
      severity: 2,
      impact,
      correct,
      decisionScore: correct ? 1 : 0,
      evidenceScore: 1,
      missedEvidence: [],
      wrongMarks: [],
      ...over,
    },
    ...caseOver,
  };
}

function ctx(cases: SessionCase[], over: Partial<BadgeContext> = {}): BadgeContext {
  return {
    shiftId: 'soc-01',
    cases,
    stars: 2,
    trust: 75,
    toolsOwned: 0,
    reviewResults: [],
    bossDefeated: false,
    ...over,
  };
}

const good = () => [decided('correct'), decided('correct'), decided('correct')];

describe('badgeEarned', () => {
  it('boss-defeated needs the boss of this shift beaten (ADR 028)', () => {
    const rule = { type: 'boss-defeated' } as const;
    expect(badgeEarned(rule, ctx(good(), { bossDefeated: true }))).toBe(true);
    expect(badgeEarned(rule, ctx(good()))).toBe(false);
    expect(badgeEarned(rule, ctx([], { shiftId: null, bossDefeated: true }))).toBe(false);
  });

  it('shift-complete: only for the named shift (or any shift without a name)', () => {
    expect(badgeEarned({ type: 'shift-complete', shiftId: 'soc-01' }, ctx(good()))).toBe(true);
    expect(badgeEarned({ type: 'shift-complete', shiftId: 'soc-05' }, ctx(good()))).toBe(false);
    expect(badgeEarned({ type: 'shift-complete' }, ctx(good()))).toBe(true);
  });

  it('shift-stars: needs at least that many stars', () => {
    const rule: BadgeRule = { type: 'shift-stars', stars: 3 };
    expect(badgeEarned(rule, ctx(good(), { stars: 3 }))).toBe(true);
    expect(badgeEarned(rule, ctx(good(), { stars: 2 }))).toBe(false);
  });

  it('no-threat-allowed: no threat let through, with a minimum of decided cases', () => {
    const rule: BadgeRule = { type: 'no-threat-allowed', minCases: 3 };
    expect(badgeEarned(rule, ctx(good()))).toBe(true);
    expect(badgeEarned(rule, ctx([...good(), decided('threat-allowed')]))).toBe(false);
    expect(badgeEarned(rule, ctx(good().slice(0, 2)))).toBe(false);
    const missed: SessionCase = { ...decided('correct'), status: 'missed', outcome: null };
    expect(badgeEarned(rule, ctx([...good(), missed]))).toBe(false);
  });

  it('no-legit-blocked: no safe item blocked or needlessly escalated', () => {
    const rule: BadgeRule = { type: 'no-legit-blocked', minCases: 3 };
    expect(badgeEarned(rule, ctx(good()))).toBe(true);
    expect(badgeEarned(rule, ctx([...good(), decided('legit-blocked')]))).toBe(false);
    expect(badgeEarned(rule, ctx([...good(), decided('needless-escalation')]))).toBe(false);
  });

  it('evidence-streak: consecutive cases (in the order opened) with exact evidence', () => {
    const rule: BadgeRule = { type: 'evidence-streak', count: 3 };
    expect(badgeEarned(rule, ctx(good()))).toBe(true);
    const broken = [
      decided('correct'),
      decided('correct', { missedEvidence: ['x'] }),
      decided('correct'),
      decided('correct'),
    ];
    expect(badgeEarned(rule, ctx(broken))).toBe(false);
    expect(badgeEarned(rule, ctx([...broken, decided('correct')]))).toBe(true);
    const wrongDecision = [decided('correct'), decided('threat-allowed'), decided('correct')];
    expect(badgeEarned(rule, ctx(wrongDecision))).toBe(false);
  });

  it('no-hints: a whole shift without asking the mentor', () => {
    const rule: BadgeRule = { type: 'no-hints', minCases: 3 };
    expect(badgeEarned(rule, ctx(good()))).toBe(true);
    const hinted = [...good(), decided('correct', {}, { hintsUsed: 1 })];
    expect(badgeEarned(rule, ctx(hinted))).toBe(false);
  });

  it('review-perfect: every review answer right (at least one)', () => {
    const rule: BadgeRule = { type: 'review-perfect' };
    expect(badgeEarned(rule, ctx(good(), { reviewResults: [{ correct: true }] }))).toBe(true);
    expect(
      badgeEarned(rule, ctx(good(), { reviewResults: [{ correct: true }, { correct: false }] })),
    ).toBe(false);
    expect(badgeEarned(rule, ctx(good(), { reviewResults: [] }))).toBe(false);
  });

  it('tools-owned and trust-at-least', () => {
    expect(badgeEarned({ type: 'tools-owned', count: 4 }, ctx([], { toolsOwned: 4 }))).toBe(true);
    expect(badgeEarned({ type: 'tools-owned', count: 4 }, ctx([], { toolsOwned: 3 }))).toBe(false);
    expect(badgeEarned({ type: 'trust-at-least', value: 90 }, ctx([], { trust: 90 }))).toBe(true);
    expect(badgeEarned({ type: 'trust-at-least', value: 90 }, ctx([], { trust: 89 }))).toBe(false);
  });
});

describe('newBadges', () => {
  it('returns only badges that are earned now and not earned before, in definition order', () => {
    const defs = [
      { id: 'first', rule: { type: 'shift-complete', shiftId: 'soc-01' } as const },
      { id: 'stars', rule: { type: 'shift-stars', stars: 3 } as const },
      { id: 'tools', rule: { type: 'tools-owned', count: 1 } as const },
    ];
    const c = ctx(good(), { stars: 3, toolsOwned: 1 });
    expect(newBadges(defs, {}, c)).toEqual(['first', 'stars', 'tools']);
    expect(newBadges(defs, { stars: 'T0' }, c)).toEqual(['first', 'tools']);
  });

  it('can skip shift-based rules when there is no shift (e.g. buying a tool)', () => {
    const defs = [
      { id: 'first', rule: { type: 'shift-complete' } as const },
      { id: 'tools', rule: { type: 'tools-owned', count: 1 } as const },
    ];
    expect(newBadges(defs, {}, ctx([], { shiftId: null, toolsOwned: 1 }))).toEqual(['tools']);
  });
});

describe('minStars (no badges for careless play)', () => {
  it('blocks shift badges when the shift scored below the required stars', () => {
    for (const rule of [
      { type: 'no-threat-allowed', minCases: 3, minStars: 2 },
      { type: 'no-legit-blocked', minCases: 3, minStars: 2 },
      { type: 'no-hints', minCases: 3, minStars: 2 },
    ] as const) {
      expect(badgeEarned(rule, ctx(good(), { stars: 1 }))).toBe(false);
      expect(badgeEarned(rule, ctx(good(), { stars: 2 }))).toBe(true);
    }
  });
});

describe('currentStreak (combo counter on the desk)', () => {
  it('counts trailing correct decisions in the order cases were opened', () => {
    const a = decided('correct');
    const b = decided('threat-allowed');
    const c = decided('correct');
    const d = decided('correct', { missedEvidence: ['x'] });
    expect(currentStreak([d, a, c, b])).toBe(2);
  });

  it('is zero with no decisions or after a wrong one', () => {
    expect(currentStreak([])).toBe(0);
    expect(currentStreak([decided('correct'), decided('legit-blocked')])).toBe(0);
  });

  it('ignores cases that are still open or missed', () => {
    const open = decided('correct', {}, { status: 'arrived', outcome: null });
    expect(currentStreak([decided('correct'), open])).toBe(1);
  });
});
