import type { CSSProperties } from 'react';
import { id } from '../../../i18n/id.ts';
import type { DecisionId } from '../../../engine/types.ts';

const ICON: Record<string, string> = {
  allow: '✓',
  block: '⛔',
  escalate: '⬆',
  'reset-password': '🔁',
  quarantine: '🛡',
};
const COLOR: Record<string, string> = {
  allow: 'bg-safe text-bg',
  block: 'bg-danger text-bg',
  escalate: 'bg-accent text-bg',
};

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
      className="sticky bottom-0 grid grid-cols-[repeat(var(--cols-sm),minmax(0,1fr))] gap-2 border-t-2 border-ink/40 bg-panel p-2 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
      style={
        {
          // HP: ≤ 3 aksi satu baris, 4 aksi 2×2, 5–6 aksi 3 kolom (dua baris).
          '--cols': decisions.length,
          '--cols-sm': decisions.length <= 3 ? decisions.length : decisions.length === 4 ? 2 : 3,
        } as CSSProperties
      }
    >
      {decisions.map((d) => (
        <button
          key={d.id}
          type="button"
          data-decision={d.id}
          disabled={disabled}
          onClick={() => onDecide(d.id)}
          className={
            (decisions.length > 3
              ? 'text-xs sm:text-base '
              : 'whitespace-nowrap text-sm sm:text-base ') +
            'min-h-12 border-2 border-ink px-2 font-stamp ' +
            'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
            'disabled:cursor-not-allowed disabled:opacity-40 ' +
            (COLOR[d.id] ?? 'bg-focus text-bg')
          }
        >
          <span aria-hidden="true">{ICON[d.id] ?? '•'} </span>
          {d.label}
        </button>
      ))}
    </nav>
  );
}
