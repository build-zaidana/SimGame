import { describe, expect, it } from 'vitest';
import { createRng, nextFloat, nextInt } from '../rng';

describe('rng (mulberry32)', () => {
  it('is deterministic for the same seed', () => {
    const run = (seed: number) => {
      let s = createRng(seed);
      const out: number[] = [];
      for (let i = 0; i < 5; i++) {
        const [v, next] = nextFloat(s);
        out.push(v);
        s = next;
      }
      return out;
    };
    expect(run(42)).toEqual(run(42));
    expect(run(42)).not.toEqual(run(43));
  });

  it('returns floats in [0, 1)', () => {
    let s = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const [v, next] = nextFloat(s);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      s = next;
    }
  });

  it('nextInt stays within the inclusive range', () => {
    let s = createRng(1);
    for (let i = 0; i < 1000; i++) {
      const [v, next] = nextInt(s, 3, 5);
      expect([3, 4, 5]).toContain(v);
      s = next;
    }
  });

  it('state is plain data and does not mutate', () => {
    const s = createRng(99);
    const copy = JSON.parse(JSON.stringify(s)) as typeof s;
    nextFloat(s);
    expect(s).toEqual(copy);
    expect(nextFloat(copy)[0]).toBe(nextFloat(s)[0]);
  });
});
