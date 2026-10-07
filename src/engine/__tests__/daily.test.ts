import { describe, expect, it } from 'vitest';
import { dailyCases, dailyReward, nextDailyStreak, previousDate } from '../daily.ts';

describe('dailyCases', () => {
  const pool = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  it('is the same for everyone on the same date and mode', () => {
    expect(dailyCases(pool, '2026-10-07', 'soc')).toEqual(dailyCases(pool, '2026-10-07', 'soc'));
  });

  it('picks distinct cases from the pool, in pool order', () => {
    const picked = dailyCases(pool, '2026-10-07', 'soc');
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
    expect(picked.every((c) => pool.includes(c))).toBe(true);
    expect(picked).toEqual([...picked].sort((x, y) => pool.indexOf(x) - pool.indexOf(y)));
  });

  it('changes from day to day', () => {
    const days = ['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10'];
    expect(new Set(days.map((d) => dailyCases(pool, d, 'soc').join())).size).toBeGreaterThan(1);
  });

  it('uses the whole pool when it is small', () => {
    expect(dailyCases(['x', 'y'], '2026-10-07', 'dev')).toEqual(['x', 'y']);
    expect(dailyCases([], '2026-10-07', 'dev')).toEqual([]);
  });
});

describe('previousDate', () => {
  it.each([
    ['2026-10-07', '2026-10-06'],
    ['2026-10-01', '2026-09-30'],
    ['2026-01-01', '2025-12-31'],
    ['2028-03-01', '2028-02-29'],
    ['2026-03-01', '2026-02-28'],
    ['2100-03-01', '2100-02-28'],
    ['2026-05-01', '2026-04-30'],
  ])('%s → %s', (d, prev) => expect(previousDate(d)).toBe(prev));
});

describe('nextDailyStreak', () => {
  it('starts at 1', () => {
    expect(nextDailyStreak({ streak: 0 }, '2026-10-07')).toBe(1);
  });
  it('continues from yesterday', () => {
    expect(nextDailyStreak({ streak: 3, lastDate: '2026-10-06' }, '2026-10-07')).toBe(4);
  });
  it('does not grow twice on the same day', () => {
    expect(nextDailyStreak({ streak: 3, lastDate: '2026-10-07' }, '2026-10-07')).toBe(3);
  });
  it('restarts after a missed day', () => {
    expect(nextDailyStreak({ streak: 9, lastDate: '2026-10-04' }, '2026-10-07')).toBe(1);
  });
});

describe('dailyReward', () => {
  it('pays per correct case', () => {
    expect(dailyReward(2, 3, 1)).toBe(20);
  });
  it('adds a streak bonus for a perfect run, capped at 5 days', () => {
    expect(dailyReward(3, 3, 1)).toBe(35);
    expect(dailyReward(3, 3, 4)).toBe(50);
    expect(dailyReward(3, 3, 12)).toBe(55);
  });
  it('pays nothing for nothing', () => {
    expect(dailyReward(0, 3, 5)).toBe(0);
  });
});
