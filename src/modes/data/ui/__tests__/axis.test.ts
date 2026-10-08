import { describe, expect, it } from 'vitest';
import { axisTop } from '../axis.ts';

describe('axisTop (chart Y axis, ADR 031)', () => {
  it('fits the data range with a little headroom and a round number', () => {
    expect(axisTop(0, 1000)).toBe(1200);
    expect(axisTop(0, 85)).toBe(100);
    expect(axisTop(0, 4)).toBe(5);
  });

  it('a cut axis zooms into the data, so a small rise looks big (what the player must notice)', () => {
    const top = axisTop(950, 1000);
    expect(top).toBe(1010);
    const h = (v: number) => (v - 950) / (top - 950);
    // 980 → 1000 is only +2%, but the bar grows by about two thirds.
    expect(h(1000) / h(980)).toBeGreaterThan(1.6);
  });

  it('never returns a top at or below the start', () => {
    expect(axisTop(5, 5)).toBeGreaterThan(5);
    expect(axisTop(0, 0)).toBeGreaterThan(0);
  });
});
