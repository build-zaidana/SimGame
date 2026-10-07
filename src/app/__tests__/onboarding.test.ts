import { describe, expect, it } from 'vitest';
import { createNewSave, newModeProgress, type SaveData } from '../../persistence/saveSchema.ts';
import { dismissTip, nextTip, resetTips, skipAllTips, TIP_IDS } from '../onboarding.ts';

const fresh = (): SaveData => createNewSave({ installId: 'x', now: '2026-10-07T08:00:00.000Z' });

const afterFirstShift = (wallet: number): SaveData => ({
  ...fresh(),
  modes: {
    soc: {
      ...newModeProgress(),
      wallet,
      shifts: { 'soc-01': { bestScore: 70, stars: 2, completedAt: '2026-10-07' } },
    },
  },
});

const seen = (save: SaveData, ...ids: string[]): SaveData => ({
  ...save,
  flags: { ...save.flags, ...Object.fromEntries(ids.map((i) => [`tip:${i}`, true])) },
});

describe('nextTip (onboarding, ADR 030)', () => {
  it('welcomes a brand-new player first, and nothing else before they play', () => {
    expect(nextTip(fresh())).toBe('welcome');
    expect(nextTip(seen(fresh(), 'welcome'))).toBeNull();
  });

  it('explains rank, daily challenge, shop and practice one at a time after the first shift', () => {
    let save = seen(afterFirstShift(80), 'welcome');
    const order: string[] = [];
    for (let tip = nextTip(save); tip; tip = nextTip(save)) {
      order.push(tip);
      save = dismissTip(save, tip);
    }
    expect(order).toEqual(['rank', 'daily', 'shop', 'practice']);
  });

  it('waits with the shop tip until the player can afford an upgrade', () => {
    const save = seen(afterFirstShift(10), 'welcome', 'rank', 'daily');
    expect(nextTip(save)).toBe('practice');
  });

  it('ignores shift records without a completion time', () => {
    const save = seen(
      {
        ...fresh(),
        modes: {
          soc: { ...newModeProgress(), shifts: { 'soc-01': { bestScore: 0, stars: 0 } } },
        },
      },
      'welcome',
    );
    expect(nextTip(save)).toBeNull();
  });

  it('can skip every tip and bring them back', () => {
    const skipped = skipAllTips(afterFirstShift(80));
    expect(nextTip(skipped)).toBeNull();
    expect(TIP_IDS.every((id) => skipped.flags[`tip:${id}`])).toBe(true);
    expect(nextTip(resetTips(skipped))).toBe('welcome');
  });

  it('keeps unrelated flags when resetting', () => {
    const save = {
      ...skipAllTips(fresh()),
      flags: { exportReminderOff: true, 'tip:welcome': true },
    };
    expect(resetTips(save).flags).toEqual({ exportReminderOff: true });
  });
});
