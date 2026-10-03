import { useRef, useState } from 'react';
import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { id } from '../../../../i18n/id.ts';
import type { DocumentProps } from '../../../contract.ts';
import type { EmailCase } from './schema.ts';

const LONG_PRESS_MS = 500;
type LinkPart = Extract<EmailCase['data']['body'][number], { link: unknown }>;

/**
 * Tautan tidak pernah menjadi <a href>. Alamat asli muncul lewat tahan lama (sentuh),
 * klik kanan, atau tombol menu konteks keyboard (Shift+F10).
 */
function LinkEvidence({
  part,
  ...ev
}: { part: LinkPart } & Omit<DocumentProps, 'data' | 'marks'> & { marked: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        setRevealed(true);
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== 'touch') return;
        suppressClick.current = false;
        timer.current = window.setTimeout(() => {
          suppressClick.current = true;
          setRevealed(true);
        }, LONG_PRESS_MS);
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          e.stopPropagation();
        }
      }}
    >
      <Evidence
        evidenceId={part.evidenceId}
        marked={ev.marked}
        locked={ev.locked}
        onToggle={ev.onToggleMark}
      >
        <span className="text-focus">{part.link.label}</span>
      </Evidence>
      {revealed && (
        <p className="px-1 text-sm" data-testid="real-address">
          {id.soc.email.realAddress} <code className="break-all text-accent">{part.link.href}</code>
        </p>
      )}
    </div>
  );
}

export function EmailDocument({ data, marks, onToggleMark, locked }: DocumentProps<EmailCase>) {
  const { from, subject, receivedAt, body, attachments } = data.data;
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  const hasLink = body.some((p) => 'link' in p);

  return (
    <article aria-labelledby="doc-subject" className="border-2 border-ink/40 bg-bg">
      <header className="border-b-2 border-ink/40 p-3">
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 text-sm">
          <dt className="text-ink-muted">{id.soc.email.from}</dt>
          <dd>
            <Evidence {...mark(from.evidenceId)}>
              <span className="block font-bold">{from.name}</span>
              <span className="block break-all">&lt;{from.address}&gt;</span>
            </Evidence>
          </dd>
          <dt className="text-ink-muted">{id.soc.email.subject}</dt>
          <dd id="doc-subject">
            <Evidence {...mark(subject.evidenceId)}>
              <span className="font-bold">{subject.text}</span>
            </Evidence>
          </dd>
          {receivedAt && (
            <>
              <dt className="text-ink-muted">{id.soc.email.received}</dt>
              <dd className="px-1">{receivedAt}</dd>
            </>
          )}
        </dl>
      </header>
      <div className="flex flex-col p-3">
        {body.map((part, i) =>
          'link' in part ? (
            <LinkEvidence
              key={i}
              part={part}
              marked={part.evidenceId ? marks.has(part.evidenceId) : false}
              locked={locked}
              onToggleMark={onToggleMark}
            />
          ) : (
            <Evidence key={i} {...mark(part.evidenceId)}>
              {part.text}
            </Evidence>
          ),
        )}
      </div>
      {attachments.length > 0 && (
        <footer className="border-t-2 border-ink/40 p-3 text-sm">
          <p className="text-ink-muted">{id.soc.email.attachments}</p>
          {attachments.map((a, i) => (
            <Evidence key={i} {...mark(a.evidenceId)}>
              <span aria-hidden="true">📎 </span>
              {a.name} ({a.size})
            </Evidence>
          ))}
        </footer>
      )}
      {hasLink && (
        <p className="border-t-2 border-ink/40 p-3 text-xs text-ink-muted">
          {id.soc.email.revealHint}
        </p>
      )}
    </article>
  );
}
