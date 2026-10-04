import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import type { DiagnosticCase } from './schema.ts';

export function DiagnosticDocument({
  data,
  marks,
  onToggleMark,
  locked,
}: DocumentProps<DiagnosticCase>) {
  const { device, readings, console: lines, note } = data.data;
  const t = id.support.diagnostic;
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  return (
    <article aria-labelledby="doc-heading" className="border-2 border-ink/40 bg-bg p-3">
      <h2 id="doc-heading" className="font-display text-accent">
        <span aria-hidden="true">📊 </span>
        {t.heading}
      </h2>
      <p className="mb-3 px-1 text-sm text-ink-muted">
        {t.device}: <strong className="text-ink">{device.name}</strong> · {device.owner}
      </p>
      <p className="px-1 text-sm text-ink-muted">{t.readings}</p>
      <dl className="mb-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {readings.map((r) => (
          <div key={r.label}>
            <Evidence {...mark(r.evidenceId)}>
              <dt className="inline text-ink-muted">{r.label}: </dt>
              <dd className="inline font-mono font-bold">{r.value}</dd>
            </Evidence>
          </div>
        ))}
      </dl>
      {lines.length > 0 && (
        <>
          <p className="px-1 text-sm text-ink-muted">{t.console}</p>
          <div className="mb-3 border-2 border-ink/40 bg-panel font-mono text-sm">
            {lines.map((l, i) => (
              <Evidence key={i} {...mark(l.evidenceId)}>
                <span className="break-all">{l.text}</span>
              </Evidence>
            ))}
          </div>
        </>
      )}
      {note && (
        <>
          <p className="px-1 text-sm text-ink-muted">{t.note}</p>
          <Evidence {...mark(note.evidenceId)}>{note.text}</Evidence>
        </>
      )}
    </article>
  );
}
