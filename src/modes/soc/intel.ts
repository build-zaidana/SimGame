/** Logika murni di balik alat SOC (Pemeriksa Tautan, Filter Log). */

/** Akhiran dua tingkat yang umum di Indonesia; pemiliknya satu nama sebelum akhiran ini. */
const TWO_LEVEL_SUFFIXES = ['co.id', 'ac.id', 'go.id', 'or.id', 'web.id', 'my.id', 'sch.id'];

export function hostOf(urlOrAddress: string): string {
  const s = urlOrAddress.trim().toLowerCase();
  const afterAt = s.includes('@') && !s.includes('/') ? s.slice(s.lastIndexOf('@') + 1) : s;
  return afterAt.replace(/^[a-z]+:\/\//, '').split(/[/?#:]/)[0] ?? '';
}

/** Pemilik situs = satu nama sebelum akhiran, dibaca dari kanan. */
export function ownerOf(host: string): string {
  const labels = host.toLowerCase().split('.').filter(Boolean);
  if (labels.length <= 2) return labels.join('.');
  const lastTwo = labels.slice(-2).join('.');
  const take = TWO_LEVEL_SUFFIXES.includes(lastTwo) ? 3 : 2;
  return labels.slice(-take).join('.');
}

export interface IpSummary {
  ip: string;
  failed: number;
  success: number;
  locations: string[];
}

export function summarizeByIp(
  events: readonly { ip: string; result: 'success' | 'failed'; location: string }[],
): IpSummary[] {
  const map = new Map<string, IpSummary>();
  for (const e of events) {
    const row = map.get(e.ip) ?? { ip: e.ip, failed: 0, success: 0, locations: [] };
    if (e.result === 'failed') row.failed += 1;
    else row.success += 1;
    if (!row.locations.includes(e.location)) row.locations.push(e.location);
    map.set(e.ip, row);
  }
  return [...map.values()].sort((a, b) => b.failed - a.failed);
}
