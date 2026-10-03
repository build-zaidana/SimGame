import { id } from '../../../i18n/id.ts';
import type { DecisionId } from '../../../engine/types.ts';

const ICON: Record<string, string> = { allow: '✓', block: '⛔', escalate: '⬆' };

interface ActionBarProps {
  decisions: { id: DecisionId; label: string }[];
  disabled: boolean;
  onDecide(decision: DecisionId): void;
}

/** Bar keputusan, lengket di bawah (jangkauan jempol di HP). */
export function ActionBar({ decisions, disabled, onDecide }: ActionBarProps) {
  return (
    <nav
      aria-label={id.desk.actionsLabel}
      className="sticky bottom-0 grid gap-2 border-t-2 border-ink/40 bg-panel p-2"
      style={{ gridTemplateColumns: `repeat(${decisions.length}, minmax(0, 1fr))` }}
    >
      {decisions.map((d) => (
        <button
          key={d.id}
          type="button"
          data-decision={d.id}
          disabled={disabled}
          onClick={() => onDecide(d.id)}
          className={
            'min-h-12 border-2 border-ink px-2 font-display uppercase tracking-wide ' +
            'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
            'disabled:cursor-not-allowed disabled:opacity-40 ' +
            (d.id === 'block'
              ? 'bg-danger text-bg'
              : d.id === 'allow'
                ? 'bg-safe text-bg'
                : 'bg-accent text-bg')
          }
        >
          <span aria-hidden="true">{ICON[d.id] ?? '•'} </span>
          {d.label}
        </button>
      ))}
    </nav>
  );
}
