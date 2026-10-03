import { useEffect } from 'react';
import { useAppStore } from '../store.ts';
import { music } from './player.ts';
import type { Track } from './compose.ts';

/** Sisa jam shift di bawah ini → musik meja menjadi lebih tegang. */
const TENSE_FROM = 0.8;

/**
 * Memilih lagu sesuai layar: meja SOC saat shift berjalan, lagu kantor di tempat lain.
 * Diam saat pengaturan Musik mati, shift dijeda, layar judul, atau tab disembunyikan.
 */
export function useMusic() {
  const enabled = useAppStore((s) => s.save?.profile.settings.music ?? false);
  const screen = useAppStore((s) => s.screen);
  const running = useAppStore(
    (s) =>
      !!s.session &&
      !s.session.paused &&
      s.session.phase !== 'briefing' &&
      s.session.phase !== 'ended',
  );
  const tense = useAppStore((s) =>
    s.session ? s.session.elapsedMs / Math.max(1, s.session.durationMs) >= TENSE_FROM : false,
  );

  useEffect(() => {
    const pick = (): Track | null => {
      if (!enabled || screen === 'title' || document.visibilityState === 'hidden') return null;
      if (screen === 'desk') return running ? 'desk' : null;
      return 'office';
    };
    music.play(pick(), tense ? 1 : 0);
    const onVisibility = () => music.play(pick(), tense ? 1 : 0);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled, screen, running, tense]);
}
