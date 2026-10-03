import { id } from '../../i18n/id.ts';
import { useAppStore } from '../store.ts';
import { btnPrimary } from '../ui/styles.ts';

export function TitleScreen() {
  const goTo = useAppStore((s) => s.goTo);
  const ready = useAppStore((s) => s.status === 'ready');
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="font-display text-4xl tracking-wide text-accent">{id.app.name}</h1>
      <p className="max-w-xs text-ink-muted">{id.app.tagline}</p>
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
