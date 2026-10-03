import { describe, expect, it } from 'vitest';
import { newsTier } from '../news.ts';

describe('newsTier (berita dampak koran pagi)', () => {
  it('has no impact story before the first shift', () => {
    expect(newsTier(undefined, 75)).toBeNull();
  });
  it('is good news after a 3-star shift with healthy trust', () => {
    expect(newsTier({ stars: 3 }, 80)).toBe('good');
  });
  it('is bad news after 0–1 stars or when trust is low', () => {
    expect(newsTier({ stars: 1 }, 90)).toBe('bad');
    expect(newsTier({ stars: 0 }, 75)).toBe('bad');
    expect(newsTier({ stars: 3 }, 49)).toBe('bad');
  });
  it('is mixed otherwise', () => {
    expect(newsTier({ stars: 2 }, 75)).toBe('mixed');
    expect(newsTier({ stars: 3 }, 60)).toBe('mixed');
  });
});
