import { describe, expect, it } from 'vitest';
import { applyTrust, buyTool, shiftPay, trustDelta } from '../economy.ts';

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

describe('shiftPay', () => {
  it('is base + perCorrect × correct', () => {
    expect(shiftPay({ base: 100, perCorrect: 10 }, 6)).toBe(160);
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
