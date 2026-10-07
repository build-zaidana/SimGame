import type { CSSProperties } from 'react';
import { t as id } from '../../../i18n/index.ts';
import type { DecisionId } from '../../../engine/types.ts';

const ICON: Record<string, string> = {
  allow: '✓',
  block: '⛔',
  escalate: '⬆',
  'reset-password': '🔁',
  quarantine: '🛡',
  guide: '💬',
  fix: '🔧',
  replace: '🔩',
  approve: '✓',
  revise: '✏',
  rollback: '⏪',
  submit: '🚀',
};
const COLOR: Record<string, string> = {
  allow: 'bg-safe text-bg',
  block: 'bg-danger text-bg',
  escalate: 'bg-accent text-bg',
  guide: 'bg-safe text-bg',
  replace: 'bg-danger text-bg',
  approve: 'bg-safe text-bg',
  rollback: 'bg-danger text-bg',
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
            // HP: ikon di atas label dan huruf lebih rapat, supaya label tetap muat di teks
            // "Sangat besar" tanpa melebarkan halaman (label panjang boleh patah).
            (decisions.length > 3 ? 'text-xs ' : 'text-sm ') +
            'flex min-h-12 min-w-0 flex-col items-center justify-center leading-tight ' +
            '[overflow-wrap:anywhere] tracking-normal ' +
            'sm:flex-row sm:gap-1 sm:text-base sm:tracking-[0.08em] ' +
            'border-2 border-ink px-1 py-1 font-stamp ' +
            'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-focus ' +
            'disabled:cursor-not-allowed disabled:opacity-40 ' +
            (COLOR[d.id] ?? 'bg-focus text-bg')
          }
        >
          <span aria-hidden="true">{ICON[d.id] ?? '•'}</span>
          <span className="min-w-0">{d.label}</span>
        </button>
      ))}
    </nav>
  );
}
