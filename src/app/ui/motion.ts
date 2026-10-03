/** true bila pemain (Pengaturan) atau sistem operasi meminta animasi dikurangi. */
export function prefersReducedMotion(): boolean {
  if (typeof document === 'undefined') return true;
  if (document.documentElement.dataset['reduceMotion'] === 'true') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
