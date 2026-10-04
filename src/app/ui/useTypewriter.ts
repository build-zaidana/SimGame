import { useEffect, useState } from 'react';
import { playSfx } from '../sfx.ts';
import { useAppStore } from '../store.ts';
import { prefersReducedMotion } from './motion.ts';

const MS_PER_CHAR = 22;
/** Bunyi "bicara" setiap beberapa huruf (bukan spasi). */
const BLIP_EVERY = 3;

/**
 * Teks yang muncul huruf demi huruf, dengan bunyi "bicara" bernada khas pembicara. Komponen yang
 * memakainya diberi `key={text}` agar mulai ulang untuk teks baru. Animasi dikurangi = langsung utuh.
 */
export function useTypewriter(
  text: string,
  pitch = 1,
): { shown: number; done: boolean; skip(): void } {
  const instant = prefersReducedMotion();
  const sound = useAppStore((s) => s.save?.profile.settings.sound ?? false);
  const [shown, setShown] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (shown >= text.length) return;
    const t = window.setTimeout(() => {
      const next = shown + 1;
      setShown(next);
      if (sound && next % BLIP_EVERY === 0 && text[next - 1] !== ' ') playSfx('blip', 0, pitch);
    }, MS_PER_CHAR);
    return () => window.clearTimeout(t);
  }, [shown, text, sound, pitch]);
  return { shown, done: shown >= text.length, skip: () => setShown(text.length) };
}
