import { describe, expect, it } from 'vitest';
import { hostOf, ownerOf, summarizeByIp } from '../intel.ts';

describe('ownerOf (read the domain from the right)', () => {
  it.each([
    ['banknusantara.test', 'banknusantara.test'],
    ['login.banknusantara.test', 'banknusantara.test'],
    ['banknusantara.akun-aman.test', 'akun-aman.test'],
    ['portal.nusadigital.co.id', 'nusadigital.co.id'],
    ['a.b.example.com', 'example.com'],
    ['localhost', 'localhost'],
  ])('%s → %s', (host, owner) => {
    expect(ownerOf(host)).toBe(owner);
  });
});

describe('hostOf', () => {
  it('extracts the host from URLs and email addresses', () => {
    expect(hostOf('http://banknusantara.akun-aman.test/login?a=1')).toBe(
      'banknusantara.akun-aman.test',
    );
    expect(hostOf('https://x.test')).toBe('x.test');
    expect(hostOf('info@kirimcepat.test')).toBe('kirimcepat.test');
    expect(hostOf('kirimcepat.test/lacak')).toBe('kirimcepat.test');
  });
});

describe('summarizeByIp (Filter Log)', () => {
  it('groups failed and successful logins per IP, most failures first', () => {
    const ev = (ip: string, result: 'success' | 'failed', location = 'X') => ({
      ip,
      result,
      location,
    });
    expect(
      summarizeByIp([
        ev('1.1.1.1', 'failed'),
        ev('2.2.2.2', 'success', 'Y'),
        ev('1.1.1.1', 'failed'),
        ev('1.1.1.1', 'success'),
      ]),
    ).toEqual([
      { ip: '1.1.1.1', failed: 2, success: 1, locations: ['X'] },
      { ip: '2.2.2.2', failed: 0, success: 1, locations: ['Y'] },
    ]);
  });
});
