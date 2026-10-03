import { describe, expect, it } from 'vitest';
import {
  applyTrust,
  BASELINE_TRUST,
  buyTool,
  carryTrust,
  shiftPay,
  trustDelta,
} from '../economy.ts';

describe('trustDelta', () => {
  it.each([
    ['correct', 2, 1],
    ['threat-allowed', 1, -5],
    ['threat-allowed', 3, -15],
    ['legit-blocked', 2, -3],
    ['needless-escalation', 1, -1],
    ['partial', 2, 0],
    ['wrong', 2, 0],
  ] as const)('%s (severity %i) → %i', (impact, severity, delta) => {
    expect(trustDelta(impact, severity)).toBe(delta);
  });
});

describe('applyTrust', () => {
  it('clamps to [0, 100]', () => {
    expect(applyTrust(100, 1)).toBe(100);
    expect(applyTrust(3, -15)).toBe(0);
    expect(applyTrust(50, -3)).toBe(47);
  });
});

describe('carryTrust', () => {
  it('recovers half the gap to the baseline before the next shift (rounded up)', () => {
    expect(BASELINE_TRUST).toBe(75);
    expect(carryTrust(35)).toBe(55);
    expect(carryTrust(0)).toBe(38);
    expect(carryTrust(74)).toBe(75);
  });
  it('keeps trust at or above the baseline', () => {
    expect(carryTrust(75)).toBe(75);
    expect(carryTrust(92)).toBe(92);
  });
});

describe('shiftPay', () => {
  it('is base + perCase × Σ(score / 100), rounded', () => {
    expect(shiftPay({ base: 30, perCase: 12 }, [100, 100, 50, 0])).toBe(30 + 30);
    expect(shiftPay({ base: 30, perCase: 12 }, [33, 33])).toBe(30 + 8);
  });
  it('pays only the base when nothing was scored', () => {
    expect(shiftPay({ base: 30, perCase: 12 }, [])).toBe(30);
    expect(shiftPay({ base: 30, perCase: 12 }, [0, 0, 0])).toBe(30);
  });
  it('rewards evidence: a right decision with full evidence pays more than without', () => {
    expect(shiftPay({ base: 0, perCase: 20 }, [100])).toBeGreaterThan(
      shiftPay({ base: 0, perCase: 20 }, [60]),
    );
  });
});

describe('buyTool', () => {
  const tool = { id: 'link-checker', price: 80 };
  it('deducts the price and adds the tool', () => {
    expect(buyTool({ wallet: 100, toolsOwned: [] }, tool)).toEqual({
      ok: true,
      wallet: 20,
      toolsOwned: ['link-checker'],
    });
  });
  it('refuses when the wallet is too small', () => {
    expect(buyTool({ wallet: 79, toolsOwned: [] }, tool)).toEqual({
      ok: false,
      reason: 'insufficient-funds',
    });
  });
  it('refuses a tool that is already owned', () => {
    expect(buyTool({ wallet: 500, toolsOwned: ['link-checker'] }, tool)).toEqual({
      ok: false,
      reason: 'already-owned',
    });
  });
});
