import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import type { RequestCase } from './schema.ts';

export const REQUEST_ICON: Record<RequestCase['data']['kind'], string> = {
  share: '📤',
  quality: '🧹',
  'ai-train': '🧠',
  'ai-answer': '🤖',
};

export function RequestDocument({ data, marks, onToggleMark, locked }: DocumentProps<RequestCase>) {
  const d = data.data;
  const t = id.data.request;
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  return (
    <article aria-labelledby="doc-title" className="border-2 border-ink/40 bg-bg p-3">
      <p className="font-display text-accent">
        <span aria-hidden="true">{REQUEST_ICON[d.kind]} </span>
        {t.heading[d.kind]}
      </p>
      <h2 id="doc-title" className="text-lg font-bold">
        {d.title}
      </h2>
      <p className="mb-2 text-sm text-ink-muted">
        {t.from}: {d.from.name} · {d.from.team}
      </p>
      {d.message.map((m, i) => (
        <Evidence key={i} {...mark(m.evidenceId)}>
          {m.text}
        </Evidence>
      ))}
      {d.table && (
        <div className="mt-3 max-w-full overflow-x-auto border-2 border-ink/40">
          <table className="w-full border-collapse text-sm">
            <caption className="bg-panel px-2 py-1 text-left font-bold">
              {t.table}: {d.table.title}
            </caption>
            <thead>
              <tr>
                {d.table.columns.map((c, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="border-b-2 border-ink/40 p-0 text-left font-mono text-xs"
                  >
                    <Evidence {...mark(c.evidenceId)}>{c.name}</Evidence>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.table.rows.map((r, i) => (
                <tr key={i} className="odd:bg-ink/5">
                  {r.evidenceId ? (
                    // Satu baris utuh sebagai bukti (mis. data ganda atau nilai mustahil).
                    <td colSpan={d.table!.columns.length} className="p-0">
                      <Evidence {...mark(r.evidenceId)}>
                        <span className="grid grid-flow-col gap-2 font-mono text-xs">
                          {r.cells.map((c, j) => (
                            <span key={j}>{c}</span>
                          ))}
                        </span>
                      </Evidence>
                    </td>
                  ) : (
                    r.cells.map((c, j) => (
                      <td key={j} className="px-1 py-2 font-mono text-xs">
                        {c}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {d.chat && d.chat.length > 0 && (
        <section aria-label={t.chat} className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-ink-muted">{t.chat}</p>
          {d.chat.map((m, i) => (
            <div
              key={i}
              className={
                'max-w-[90%] border-2 px-1 ' +
                (m.who === 'ai' ? 'self-start border-focus/60 bg-panel' : 'self-end border-ink/40')
              }
            >
              <p className="px-1 pt-1 text-xs font-bold text-ink-muted">
                <span aria-hidden="true">{m.who === 'ai' ? '🤖 ' : '🙂 '}</span>
                {m.who === 'ai' ? t.ai : t.user}
              </p>
              <Evidence {...mark(m.evidenceId)}>{m.text}</Evidence>
            </div>
          ))}
        </section>
      )}
      {d.notes.length > 0 && (
        <>
          <p className="mt-3 text-sm text-ink-muted">{t.notes}</p>
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
