import { t as id } from '../../i18n/index.ts';
import { modes } from '../../modes/registry.ts';
import { useAppStore } from '../store.ts';

/** Pilihan meja di layar menu (hanya bila ada lebih dari satu mode dan tidak sedang shift). */
export function ModeTabs({ current, hidden }: { current: string; hidden?: boolean }) {
  const setMenuMode = useAppStore((s) => s.setMenuMode);
  const available = modes.filter((m) => m.status === 'available');
  if (hidden || available.length < 2) return null;
  return (
    <div role="group" aria-label={id.hub.deskPicker} className="flex flex-wrap gap-2">
      {available.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={m.id === current}
          onClick={() => setMenuMode(m.id)}
          data-mode-tab={m.id}
          className={
            'min-h-11 border-2 px-3 font-display text-sm focus-visible:outline-4 focus-visible:outline-focus ' +
            (m.id === current
              ? 'border-accent bg-accent/15 text-accent'
              : 'border-ink/40 text-ink-muted')
          }
        >
          {m.deskTitle}
        </button>
      ))}
    </div>
  );
}
