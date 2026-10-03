import type { ReactNode } from 'react';
import { t as id } from '../../i18n/index.ts';

interface EvidenceProps {
  evidenceId: string | undefined;
  marked: boolean;
  locked: boolean;
  onToggle(id: string): void;
  children: ReactNode;
  /** Sebaris dengan teks lain (mis. bagian URL), bukan satu blok penuh. */
  inline?: boolean;
}

/**
 * Bagian dokumen yang bisa ditandai. Status tidak hanya lewat warna: ada ikon ⚑ dan teks
 * tersembunyi untuk pembaca layar, plus `aria-pressed`.
 */
export function Evidence({
  evidenceId,
  marked,
  locked,
  onToggle,
  children,
  inline,
}: EvidenceProps) {
  if (!evidenceId) return <span>{children}</span>;
  return (
    <button
      type="button"
      aria-pressed={marked}
      disabled={locked}
      data-evidence={evidenceId}
      onClick={() => onToggle(evidenceId)}
      className={
        (inline ? 'inline-block break-all ' : 'block w-full ') +
        'min-h-11 px-1 py-2 text-left underline decoration-dashed decoration-ink-muted ' +
        'underline-offset-4 focus-visible:outline-4 focus-visible:outline-focus disabled:cursor-default ' +
        (marked ? 'bg-accent/25 decoration-accent decoration-solid' : 'hover:bg-ink/5')
      }
    >
      {marked && (
        <span aria-hidden="true" className="mr-1 font-display text-accent">
          ⚑
        </span>
      )}
      {children}
      {marked && <span className="sr-only"> ({id.desk.marked})</span>}
    </button>
  );
}
