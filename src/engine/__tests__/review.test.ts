import { describe, expect, it } from 'vitest';
import { recordResult } from '../mastery.ts';
import { createRng } from '../rng.ts';
import {
  gradeMcq,
  gradeOrderSteps,
  gradeTapEvidence,
  selectReviewItems,
  shuffledOrder,
} from '../review.ts';

const items = [
  { id: 'url-1', conceptId: 'url' },
  { id: 'url-2', conceptId: 'url' },
  { id: 'phish-1', conceptId: 'phish' },
  { id: 'phish-2', conceptId: 'phish' },
  { id: 'mfa-1', conceptId: 'mfa' },
  { id: 'mfa-2', conceptId: 'mfa' },
];

describe('selectReviewItems', () => {
  it('returns `count` unique items from the allowed concepts', () => {
    const ids = selectReviewItems({
      items,
      mastery: {},
      shiftIndex: 1,
      conceptIds: ['url', 'phish'],
      newConceptIds: ['url', 'phish'],
      count: 3,
      rng: createRng(1),
    });
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) expect(id).toMatch(/^(url|phish)-/);
  });

  it('includes at least one item from a new concept', () => {
    let mastery = recordResult({}, 'url-1', false, 1);
    mastery = recordResult(mastery, 'url-2', false, 1);
    const ids = selectReviewItems({
      items,
      mastery,
      shiftIndex: 2,
      conceptIds: ['url', 'mfa'],
      newConceptIds: ['mfa'],
      count: 3,
      rng: createRng(5),
    });
    expect(ids.some((id) => id.startsWith('mfa-'))).toBe(true);
  });

  it('brings back items answered wrong in an earlier shift (due), even from older concepts', () => {
    const mastery = recordResult({}, 'url-2', false, 1);
    const ids = selectReviewItems({
      items,
      mastery,
      shiftIndex: 2,
      conceptIds: ['phish'],
      newConceptIds: ['phish'],
      count: 3,
      rng: createRng(9),
    });
    expect(ids).toContain('url-2');
  });

  it('is deterministic for the same seed', () => {
    const args = {
      items,
      mastery: {},
      shiftIndex: 1,
      conceptIds: ['url', 'phish', 'mfa'],
      newConceptIds: ['url'],
      count: 4,
    };
    expect(selectReviewItems({ ...args, rng: createRng(3) })).toEqual(
      selectReviewItems({ ...args, rng: createRng(3) }),
    );
  });

  it('returns fewer items when the pool is small', () => {
    const ids = selectReviewItems({
      items: items.slice(0, 2),
      mastery: {},
      shiftIndex: 1,
      conceptIds: ['url'],
      newConceptIds: ['url'],
      count: 5,
      rng: createRng(1),
    });
    expect(ids.sort()).toEqual(['url-1', 'url-2']);
  });
});

describe('selectReviewItems due timing', () => {
  it('does not bring back a box-2 item before it is due', () => {
    const mastery = recordResult({}, 'url-1', true, 1); // box 2, due at shift 3
    const ids = selectReviewItems({
      items,
      mastery,
      shiftIndex: 2,
      conceptIds: ['mfa'],
      newConceptIds: ['mfa'],
      count: 3,
      rng: createRng(2),
    });
    expect(ids).not.toContain('url-1');
  });
});

describe('grading', () => {
  it('mcq: correct only for the answer index', () => {
    expect(gradeMcq(1, 1)).toBe(true);
    expect(gradeMcq(1, 0)).toBe(false);
  });
  it('tap-evidence: all answers marked and nothing else', () => {
    expect(gradeTapEvidence(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(gradeTapEvidence(['a', 'b'], ['a'])).toBe(false);
    expect(gradeTapEvidence(['a'], ['a', 'c'])).toBe(false);
  });
  it('order-steps: order must be 0..n-1', () => {
    expect(gradeOrderSteps([0, 1, 2])).toBe(true);
    expect(gradeOrderSteps([1, 0, 2])).toBe(false);
  });
});

describe('shuffledOrder', () => {
  it('is a deterministic permutation that is never already sorted (n ≥ 2)', () => {
    for (let seed = 0; seed < 50; seed++) {
      const order = shuffledOrder(4, createRng(seed));
      expect([...order].sort()).toEqual([0, 1, 2, 3]);
      expect(order).not.toEqual([0, 1, 2, 3]);
      expect(shuffledOrder(4, createRng(seed))).toEqual(order);
    }
  });
});
