import { describe, expect, it } from 'vitest';
import { careerRank, nextRankGoal, RANK_COUNT, rankPayBonus } from '../rank.ts';

describe('careerRank', () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 3],
    [5, 4],
  ])('%i of 5 shifts done → rank %i', (completedShifts, rank) => {
    expect(careerRank({ completedShifts, totalShifts: 5 })).toBe(rank);
  });

  it('stays at the first rank when a mode has no shifts', () => {
    expect(careerRank({ completedShifts: 0, totalShifts: 0 })).toBe(0);
  });

  it('never exceeds the top rank', () => {
    expect(careerRank({ completedShifts: 9, totalShifts: 5 })).toBe(RANK_COUNT - 1);
  });

  it('reaches the top rank exactly when every shift is done, even in short modes', () => {
    expect(careerRank({ completedShifts: 1, totalShifts: 2 })).toBe(3);
    expect(careerRank({ completedShifts: 2, totalShifts: 2 })).toBe(4);
  });
});

describe('rankPayBonus', () => {
  it('pays a growing allowance per rank', () => {
    expect([0, 1, 2, 3, 4].map(rankPayBonus)).toEqual([0, 10, 20, 30, 40]);
  });
});

describe('nextRankGoal', () => {
  it('says how many shifts are left to the next rank', () => {
    expect(nextRankGoal({ completedShifts: 0, totalShifts: 5 })).toEqual({
      rank: 1,
      shiftsLeft: 1,
    });
    expect(nextRankGoal({ completedShifts: 1, totalShifts: 5 })).toEqual({
      rank: 2,
      shiftsLeft: 2,
    });
    expect(nextRankGoal({ completedShifts: 3, totalShifts: 5 })).toEqual({
      rank: 3,
      shiftsLeft: 1,
    });
    expect(nextRankGoal({ completedShifts: 4, totalShifts: 5 })).toEqual({
      rank: 4,
      shiftsLeft: 1,
    });
  });

  it('is null at the top rank', () => {
    expect(nextRankGoal({ completedShifts: 5, totalShifts: 5 })).toBeNull();
  });
});
