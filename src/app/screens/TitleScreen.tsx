import { useRef } from 'react';
import { LOCALES, t as id } from '../../i18n/index.ts';
import { useAppStore } from '../store.ts';
import { Avatar } from '../ui/Avatar.tsx';
import { btnPrimary } from '../ui/styles.ts';

export function TitleScreen() {
  const goTo = useAppStore((s) => s.goTo);
  const ready = useAppStore((s) => s.status === 'ready');
  const openMenu = useAppStore((s) => s.openMenu);
  const locale = useAppStore((s) => s.locale);
  const setLanguage = useAppStore((s) => s.setLanguage);
  // Laporan Belajar tersembunyi: ketuk logo 5× dalam 3 detik (untuk penyelenggara uji main).
  const taps = useRef<number[]>([]);
  const onLogoTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 5 && ready) {
      taps.current = [];
      openMenu('learning-report');
    }
  };
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="font-display text-5xl tracking-wide text-accent [text-shadow:4px_4px_0_#0b0d13] sm:text-6xl">
        <button type="button" onClick={onLogoTap} className="cursor-default" data-testid="logo">
          {id.app.name}
        </button>
      </h1>
      <p className="max-w-xs text-ink-muted">{id.app.tagline}</p>
      <div role="group" aria-label={id.language.label} className="flex gap-2">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={locale === l}
            disabled={!ready}
            onClick={() => void setLanguage(l)}
            className={
              'min-h-11 border-2 px-3 font-display text-sm focus-visible:outline-4 focus-visible:outline-focus ' +
              (locale === l ? 'border-accent text-accent' : 'border-ink/40 text-ink-muted')
            }
          >
            {id.language.names[l]}
          </button>
        ))}
      </div>
      <div
        className="w-full max-w-sm border-4 border-ink/60 bg-[#0f1a14] p-3 text-left font-mono text-xs leading-relaxed text-[#74cf92] pixel-shadow sm:text-sm"
        aria-hidden="true"
      >
        {id.title.terminal.map((line, i) => (
          <p key={i} className={i === id.title.terminal.length - 1 ? 'text-[#f2c14e]' : ''}>
            {line}
          </p>
        ))}
        <p>
          &gt; <span className="blink">▮</span>
        </p>
      </div>
      <div className="flex items-end gap-4" aria-hidden="true">
        <Avatar kind="rani" className="size-16" />
        <Avatar kind="system" className="size-12" />
        <Avatar kind="kelabu" className="size-16" />
      </div>
      <button
        type="button"
        className={`${btnPrimary} min-w-32 text-lg`}
        disabled={!ready}
        onClick={() => goTo('hub')}
      >
        {ready ? id.title.play : id.app.loading}
      </button>
    </main>
  );
}
