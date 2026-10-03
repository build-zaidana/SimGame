import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { id } from '../../../../i18n/id.ts';
import type { DocumentProps } from '../../../contract.ts';
import { summarizeByIp } from '../../intel.ts';
import { SOC_TOOLS } from '../../tools.ts';
import type { LoginAlertCase } from './schema.ts';

export function LoginAlertDocument({
  data,
  marks,
  onToggleMark,
  locked,
  tools,
}: DocumentProps<LoginAlertCase>) {
  const { account, headline, events, context } = data.data;
  const t = id.soc.loginAlert;
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  return (
    <article aria-labelledby="doc-heading" className="border-2 border-ink/40 bg-bg p-3">
      <h2 id="doc-heading" className="font-display text-accent">
        <span aria-hidden="true">🔑 </span>
        {t.heading}
      </h2>
      <p className="mb-2 px-1 text-sm text-ink-muted">
        {t.account}: {account.user} ({account.role})
      </p>
      <Evidence {...mark(headline.evidenceId)}>
        <span className="font-bold">{headline.text}</span>
      </Evidence>
      <h3 className="mt-3 px-1 text-sm text-ink-muted">{t.log}</h3>
      <ol className="flex flex-col gap-1">
        {events.map((e, i) => (
          <li key={i}>
            <Evidence {...mark(e.evidenceId)}>
              <span className="grid grid-cols-[auto_1fr] gap-x-3 font-mono text-sm">
                <span className="font-bold">{e.time}</span>
                <span className={e.result === 'success' ? 'text-safe' : 'text-danger'}>
                  <span aria-hidden="true">{e.result === 'success' ? '✓ ' : '✗ '}</span>
                  {e.result === 'success' ? t.success : t.failed}
                  {e.method ? ` · ${e.method}` : ''}
                </span>
                <span className="text-ink-muted">{t.from}</span>
                <span>
                  {e.location} · {e.ip}
                </span>
                <span className="text-ink-muted">{t.device}</span>
                <span>{e.device}</span>
              </span>
            </Evidence>
          </li>
        ))}
      </ol>
      {tools.has(SOC_TOOLS.logFilter) && (
        <section className="mt-3 border-2 border-focus/60 p-2" data-testid="log-filter">
          <h3 className="text-sm font-bold">
            <span aria-hidden="true">🧮 </span>
            {id.tools.logFilterHeading}
          </h3>
          <ul className="mt-1 font-mono text-sm">
            {summarizeByIp(events).map((r) => (
              <li key={r.ip}>
                {r.ip} ({r.locations.join(', ')}): {id.tools.logFilterRow(r.failed, r.success)}
              </li>
            ))}
          </ul>
        </section>
      )}
      {context.length > 0 && (
        <>
          <h3 className="mt-3 px-1 text-sm text-ink-muted">{t.context}</h3>
          {context.map((c, i) => (
            <Evidence key={i} {...mark(c.evidenceId)}>
              {c.text}
            </Evidence>
          ))}
        </>
      )}
    </article>
  );
}
