import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import type { TicketCase } from './schema.ts';

export function TicketDocument({ data, marks, onToggleMark, locked }: DocumentProps<TicketCase>) {
  const { requester, device, subject, description, history } = data.data;
  const t = id.support.ticket;
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  return (
    <article aria-labelledby="doc-subject" className="border-2 border-ink/40 bg-bg">
      <header className="border-b-2 border-ink/40 p-3">
        <p className="mb-2 font-display text-accent">
          <span aria-hidden="true">🎫 </span>
          {t.heading}
        </p>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 text-sm">
          <dt className="text-ink-muted">{t.requester}</dt>
          <dd className="px-1">
            {requester.name} · {requester.department}
          </dd>
          <dt className="text-ink-muted">{t.device}</dt>
          <dd>
            <Evidence {...mark(device.evidenceId)}>{device.text}</Evidence>
          </dd>
          <dt className="text-ink-muted">{t.subject}</dt>
          <dd id="doc-subject">
            <Evidence {...mark(subject.evidenceId)}>
              <span className="font-bold">{subject.text}</span>
            </Evidence>
          </dd>
        </dl>
      </header>
      <section className="flex flex-col p-3" aria-label={t.description}>
        {description.map((part, i) => (
          <Evidence key={i} {...mark(part.evidenceId)}>
            {part.text}
          </Evidence>
        ))}
      </section>
      {history.length > 0 && (
        <footer className="border-t-2 border-ink/40 p-3 text-sm">
          <p className="text-ink-muted">{t.history}</p>
          {history.map((h, i) => (
            <Evidence key={i} {...mark(h.evidenceId)}>
              <span aria-hidden="true">🕘 </span>
              {h.text}
            </Evidence>
          ))}
        </footer>
      )}
    </article>
  );
}
