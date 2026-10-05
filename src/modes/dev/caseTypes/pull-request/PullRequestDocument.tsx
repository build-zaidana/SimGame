import { Evidence } from '../../../../app/ui/Evidence.tsx';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import { tokenizeLine } from '../../ui/pyHighlight.ts';
import type { PullRequestCase } from './schema.ts';

const SIGN = { add: '+', del: '−', ctx: ' ' } as const;
const ROW = { add: 'bg-safe/15', del: 'bg-danger/15', ctx: '' } as const;
const TOKEN: Record<string, string> = {
  kw: 'font-bold text-[#7a3e9d]',
  str: 'text-[#2f6b1f]',
  num: 'text-[#8a4b08]',
  com: 'italic text-ink-muted',
  fn: 'text-[#1f5a96]',
};

export function PullRequestDocument({
  data,
  marks,
  onToggleMark,
  locked,
}: DocumentProps<PullRequestCase>) {
  const d = data.data;
  const t = id.dev.pr;
  const mark = (evidenceId: string | undefined) => ({
    evidenceId,
    marked: evidenceId ? marks.has(evidenceId) : false,
    locked,
    onToggle: onToggleMark,
  });
  const added = d.diff.filter((l) => l.kind === 'add').length;
  const removed = d.diff.filter((l) => l.kind === 'del').length;
  return (
    <article aria-labelledby="doc-title" className="border-2 border-ink/40 bg-bg p-3">
      <p className="font-display text-accent">
        <span aria-hidden="true">🔀 </span>
        {t.heading}
      </p>
      <h2 id="doc-title" className="text-lg font-bold">
        {d.title}
      </h2>
      <p className="mb-2 text-sm text-ink-muted">
        {t.author}: {d.author.name} · {d.author.team}
      </p>
      {d.description.map((p, i) => (
        <Evidence key={i} {...mark(p.evidenceId)}>
          {p.text}
        </Evidence>
      ))}
      <p className="mt-3 font-mono text-sm">
        {t.file}: <strong>{d.file}</strong> <span className="text-safe">+{added}</span>{' '}
        <span className="text-danger">−{removed}</span>
        <span className="sr-only">
          {' '}
          ({added} {t.added}, {removed} {t.removed})
        </span>
      </p>
      <div
        className="mt-1 border-2 border-ink/40 font-mono text-sm"
        aria-label={t.diff}
        role="group"
      >
        {d.diff.map((l, i) => (
          <div key={i} className={ROW[l.kind]}>
            <Evidence {...mark(l.evidenceId)}>
              <span className="whitespace-pre">
                <span aria-hidden="true" className="mr-2 inline-block w-3 text-ink-muted">
                  {SIGN[l.kind]}
                </span>
                {l.kind !== 'ctx' && (
                  <span className="sr-only">{l.kind === 'add' ? t.added : t.removed}: </span>
                )}
                {' '.repeat(l.indent * 4)}
                {tokenizeLine(l.code).map((tok, j) => (
                  <span key={j} className={TOKEN[tok.kind] ?? ''}>
                    {tok.text}
                  </span>
                ))}
              </span>
            </Evidence>
          </div>
        ))}
      </div>
      {d.checks.length > 0 && (
        <>
          <p className="mt-3 text-sm text-ink-muted">{t.checks}</p>
          {d.checks.map((c, i) => (
            <Evidence key={i} {...mark(c.evidenceId)}>
              {c.text}
            </Evidence>
          ))}
        </>
      )}
    </article>
  );
}
