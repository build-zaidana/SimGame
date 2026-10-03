import { id } from '../../../i18n/id.ts';
import type { ShiftSession } from '../../../engine/types.ts';

export interface QueueItem {
  caseId: string;
  icon: string;
  title: string;
}

interface QueuePaneProps {
  session: ShiftSession;
  labelOf(caseId: string): QueueItem;
  onOpen(caseId: string): void;
}

const STATUS_GLYPH = { arrived: '•', decided: '✓', missed: '✗', pending: '' } as const;

export function QueuePane({ session, labelOf, onOpen }: QueuePaneProps) {
  const visible = session.cases.filter((c) => c.status !== 'pending');
  const waiting = visible.filter((c) => c.status === 'arrived').length === 0;
  return (
    <div className="flex flex-col gap-2 p-3">
      <h2 className="font-display text-ink-muted">{id.desk.queueHeading}</h2>
      <ol className="flex flex-col gap-2">
        {visible.map((c) => {
          const label = labelOf(c.caseId);
          const active = c.caseId === session.activeCaseId;
          const status =
            c.status === 'decided'
              ? id.desk.statusDone
              : c.status === 'missed'
                ? id.desk.statusMissed
                : active
                  ? id.desk.statusOpen
                  : id.desk.statusNew;
          return (
            <li key={c.caseId}>
              <button
                type="button"
                data-case={c.caseId}
                aria-current={active ? 'true' : undefined}
                disabled={c.status !== 'arrived'}
                onClick={() => onOpen(c.caseId)}
                className={
                  'flex min-h-11 w-full items-start gap-2 border-2 px-2 py-2 text-left ' +
                  'focus-visible:outline-4 focus-visible:outline-focus disabled:opacity-60 ' +
                  (active
                    ? 'border-accent bg-accent/15'
                    : c.status === 'arrived' && c.openedAtMs === null
                      ? 'arrive-pulse border-accent/70 bg-bg'
                      : 'border-ink/30 bg-bg')
                }
              >
                <span aria-hidden="true">{label.icon}</span>
                <span className="flex-1">
                  <span className="block leading-snug">{label.title}</span>
                  <span className="block text-xs text-ink-muted">
                    <span aria-hidden="true">{STATUS_GLYPH[c.status]} </span>
                    {status}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {waiting && session.phase !== 'ended' && (
        <p className="text-sm text-ink-muted">{id.desk.queueEmpty}</p>
      )}
    </div>
  );
}
