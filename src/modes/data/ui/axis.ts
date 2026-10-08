const NICE = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** Angka "bulat" terkecil yang ≥ x (1, 1,2, 1,5, 2, 2,5 … × 10^n). */
function niceCeil(x: number): number {
  const step = 10 ** Math.floor(Math.log10(x));
  return (NICE.find((m) => m * step >= x - 1e-9) ?? 10) * step;
}

/**
 * Batas atas sumbu Y: rentang data dari `start` + 10% ruang, dibulatkan. Sumbu yang dimulai di atas 0
 * memperbesar beda kecil (itu yang harus disadari pemain), jadi skalanya ikut rentang, bukan nilai.
 */
export function axisTop(start: number, max: number): number {
  const span = Math.max(max - start, 1e-6);
  return start + niceCeil(span * 1.1);
}
