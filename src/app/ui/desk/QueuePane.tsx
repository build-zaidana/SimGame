import type { ReactNode } from 'react';
import { t as id } from '../../../i18n/index.ts';
import type { ShiftSession } from '../../../engine/types.ts';

export interface QueueItem {
  caseId: string;
  icon: string;
  title: string;
}

/** Antrian sebagai papan kerja (proyek klien, ADR 032): kolom & kartu kejutan. */
export interface BoardLabels {
  todo: string;
  doing: string;
  done: string;
  surprise: string;
  /** Kasus kejutan (bukan kartu yang direncanakan). */
  surprises: ReadonlySet<string>;
}

interface QueuePaneProps {
  session: ShiftSession;
  board?: BoardLabels | undefined;
  /** Ditampilkan di atas antrian (mis. cerita boss). */
  header?: ReactNode;
  labelOf(caseId: string): QueueItem;
  onOpen(caseId: string): void;
}

const STATUS_GLYPH = { arrived: '•', decided: '✓', missed: '✗', pending: '' } as const;

export function QueuePane({ session, labelOf, onOpen, header, board }: QueuePaneProps) {
  const visible = session.cases.filter((c) => c.status !== 'pending');
  const waiting = visible.filter((c) => c.status === 'arrived').length === 0;
  const renderItem = (c: ShiftSession['cases'][number]) => {
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
            <span className="block leading-snug">
              {session.boss?.caseIds.includes(c.caseId) && (
                <span className="mr-1 border-2 border-danger px-1 font-display text-xs text-danger">
                  <span aria-hidden="true">👾 </span>
                  {id.boss.chip}
                </span>
              )}
              {label.title}
            </span>
            <span className="block text-xs text-ink-muted">
              <span aria-hidden="true">{STATUS_GLYPH[c.status]} </span>
              {status}
            </span>
          </span>
        </button>
      </li>
    );
  };
  if (board) {
    const columns = [
      {
        key: 'todo',
        title: board.todo,
        cases: visible.filter((c) => c.status === 'arrived' && c.openedAtMs === null),
      },
      {
        key: 'doing',
        title: board.doing,
        cases: visible.filter((c) => c.status === 'arrived' && c.openedAtMs !== null),
      },
      { key: 'done', title: board.done, cases: visible.filter((c) => c.status !== 'arrived') },
    ];
    return (
      <div className="flex flex-col gap-3 p-3" data-testid="board">
        {header}
        {columns.map((col) => (
          <section key={col.key} aria-label={col.title} data-board-column={col.key}>
            <h2 className="mb-1 font-display text-ink-muted">
              {col.title} ({col.cases.length})
            </h2>
            <ol className="flex flex-col gap-2">
              {col.cases.map((c) =>
                board.surprises.has(c.caseId) ? (
                  <li key={c.caseId} className="flex flex-col gap-1">
                    <span className="font-display text-xs text-danger">
                      <span aria-hidden="true">⚡ </span>
                      {board.surprise}
                    </span>
                    <ol>{renderItem(c)}</ol>
                  </li>
                ) : (
                  renderItem(c)
                ),
              )}
            </ol>
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 p-3">
      {header}
      <h2 className="font-display text-ink-muted">{id.desk.queueHeading}</h2>
      <ol className="flex flex-col gap-2">{visible.map(renderItem)}</ol>
      {waiting && session.phase !== 'ended' && (
        <p className="text-sm text-ink-muted">{id.desk.queueEmpty}</p>
      )}
    </div>
  );
}
