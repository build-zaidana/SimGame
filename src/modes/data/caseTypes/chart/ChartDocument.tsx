import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import { ChartView } from '../../ui/ChartView.tsx';
import type { ChartCase } from './schema.ts';

export function ChartDocument({ data, marks, onToggleMark, locked }: DocumentProps<ChartCase>) {
  const d = data.data;
  const t = id.data.chart;
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  return (
    <article aria-labelledby="doc-title" className="border-2 border-ink/40 bg-bg p-3">
      <p className="font-display text-accent">
        <span aria-hidden="true">📊 </span>
        {t.heading}
      </p>
      <h2 id="doc-title" className="text-lg font-bold">
        {d.title}
      </h2>
      <p className="text-sm text-ink-muted">
        {t.author}: {d.author.name} · {d.author.team}
      </p>
      <p className="mb-2 text-sm text-ink-muted">
        {t.purpose}: {d.purpose}
      </p>
      <p className="text-sm text-ink-muted">{t.claims}</p>
      {d.claims.map((c, i) => (
        <Evidence key={i} {...mark(c.evidenceId)}>
          <strong>{c.text}</strong>
        </Evidence>
      ))}
      <ChartView
        kind={d.chart.kind}
        title={d.chart.title}
        unit={d.chart.unit}
        axisStart={d.chart.axisStart}
        points={d.chart.points}
      />
      <Evidence {...mark(d.chart.axisEvidenceId)}>
        <span className="text-sm">{t.axis(d.chart.axisStart, d.chart.unit)}</span>
      </Evidence>
      <p className="mt-2 text-sm text-ink-muted">{t.data}</p>
      <ul className="font-mono text-sm">
        {d.chart.points.map((p, i) => (
          <li key={i}>
            <Evidence {...mark(p.evidenceId)}>
              {p.label}: {t.value(p.value)} {d.chart.unit}
            </Evidence>
          </li>
        ))}
      </ul>
      {d.notes.length > 0 && (
        <>
          <p className="mt-2 text-sm text-ink-muted">{t.notes}</p>
          {d.notes.map((n, i) => (
            <Evidence key={i} {...mark(n.evidenceId)}>
              <span className="text-sm">{n.text}</span>
            </Evidence>
          ))}
        </>
      )}
    </article>
  );
}
