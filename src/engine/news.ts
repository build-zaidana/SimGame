/** Nada berita dampak di koran pagi, dari hasil shift sebelumnya. */
export type NewsTier = 'good' | 'mixed' | 'bad';

/**
 * ★★★ dengan kepercayaan ≥ 70 = kabar baik; ≤ ★ atau kepercayaan < 50 = kabar buruk;
 * selain itu campuran. Tanpa shift sebelumnya tidak ada berita dampak.
 */
export function newsTier(prev: { stars: number } | undefined, trust: number): NewsTier | null {
  if (!prev) return null;
  if (prev.stars <= 1 || trust < 50) return 'bad';
  if (prev.stars >= 3 && trust >= 70) return 'good';
  return 'mixed';
}
