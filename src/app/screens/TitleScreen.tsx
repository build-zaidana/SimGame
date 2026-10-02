import { id } from '../../i18n/id';
import { useAppStore } from '../store';

export function TitleScreen() {
  const goTo = useAppStore((s) => s.goTo);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="font-display text-4xl tracking-wide text-accent">{id.app.name}</h1>
      <p className="max-w-xs text-ink-muted">{id.app.tagline}</p>
      <button
        type="button"
        className="min-h-11 min-w-32 border-2 border-ink bg-accent px-6 py-2 font-display text-lg text-bg focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus"
        onClick={() => goTo('hub')}
      >
        {id.title.play}
      </button>
    </main>
  );
}
