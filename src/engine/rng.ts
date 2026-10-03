/**
 * RNG ber-seed (mulberry32). State berupa data biasa agar bisa disimpan di ShiftSession
 * dan dilanjutkan dengan hasil yang sama. Engine wajib memakai ini, bukan Math.random().
 */
export interface RngState {
  readonly a: number;
}

export function createRng(seed: number): RngState {
  return { a: seed >>> 0 };
}

/** Mengembalikan [angka di [0, 1), state berikutnya]. Tidak mengubah `s`. */
export function nextFloat(s: RngState): [number, RngState] {
  const a = (s.a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, { a }];
}

/** Bilangan bulat di [min, max] (inklusif). */
export function nextInt(s: RngState, min: number, max: number): [number, RngState] {
  const [f, next] = nextFloat(s);
  return [min + Math.floor(f * (max - min + 1)), next];
}

/** Hash string → bilangan 32-bit tak bertanda (FNV-1a). Untuk variasi kosmetik yang stabil. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
