import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../../../app/store.ts';
import { playSfx } from '../../../../app/sfx.ts';
import { btnPrimary, btnSecondary } from '../../../../app/ui/styles.ts';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import { runSql, warmUpSql, type SqlOutcome } from '../../runner/runSql.ts';
import type { SqlDataset } from '../../runner/sqlHarness.ts';
import { ResultTable } from '../../ui/ResultTable.tsx';
import { SqlEditor } from '../../ui/SqlEditor.tsx';
import type { QueryCase } from './schema.ts';

/** Jeda menyimpan draf query ke sesi (setiap aksi menulis save). */
const SAVE_DRAFT_MS = 500;

/** Pesan error SQLite → petunjuk ramah pemula (kunci di i18n). */
export function sqlHintKey(error: string): string | undefined {
  if (/no such column/i.test(error)) return 'no-such-column';
  if (/no such table/i.test(error)) return 'no-such-table';
  if (/misuse of aggregate/i.test(error)) return 'aggregate';
  if (/syntax error|incomplete input/i.test(error)) return 'syntax';
  return undefined;
}

export function QueryDocument({ data, locked, answer, onAnswer, onRun }: DocumentProps<QueryCase>) {
  const d = data.data;
  const t = id.data.query;
  const r = id.data.run;
  const [code, setCode] = useState(answer?.text ?? d.starter);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<SqlOutcome | null>(null);
  const saved = useRef(answer?.text ?? d.starter);
  const sound = useAppStore((s) => s.save?.profile.settings.sound ?? false);
  useEffect(() => warmUpSql(), []);

  const flush = (text = code) => {
    // Tanpa jawaban tersimpan, query awal tetap ditulis (lihat Meja Developer).
    if (text === saved.current && answer?.text !== undefined) return;
    saved.current = text;
    onAnswer?.(text);
  };
  useEffect(() => {
    if (code === saved.current) return;
    const timer = window.setTimeout(() => {
      if (code === saved.current) return;
      saved.current = code;
      onAnswer?.(code);
    }, SAVE_DRAFT_MS);
    return () => window.clearTimeout(timer);
  }, [code, onAnswer]);

  const edit = (text: string) => {
    setCode(text);
    // Hasil lama tidak berlaku untuk query yang diubah: batalkan segera.
    if (answer?.total !== undefined) flush(text);
  };

  const datasets: SqlDataset[] = [
    { tables: d.tables },
    ...d.hidden.map((h) => ({ tables: h.tables, hidden: true })),
  ];
  const run = () => {
    flush();
    setBusy(true);
    const ran = code;
    void runSql(ran, d.solution, datasets, d.ordered).then((o) => {
      setBusy(false);
      setOutcome(o);
      if (o.kind !== 'done') return;
      const passed = o.result.datasets.filter((x) => x.passed).length;
      onRun?.(passed, datasets.length, ran);
      if (sound) playSfx(passed === datasets.length ? 'combo' : 'wrong');
    });
  };

  const result = outcome?.kind === 'done' ? outcome.result : null;
  const passed = result?.datasets.filter((x) => x.passed).length ?? 0;
  const all = !!result && passed === datasets.length;
  const sample = result?.datasets[0];
  const hint = result?.error?.kind === 'sql' ? sqlHintKey(result.error.text) : undefined;
  let hiddenNo = 0;
  return (
    <article aria-labelledby="doc-title" className="border-2 border-ink/40 bg-bg p-3">
      <p className="font-display text-accent">
        <span aria-hidden="true">{d.task === 'fix' ? '🐞 ' : '🗃 '}</span>
        {d.task === 'fix' ? t.fixHeading : t.buildHeading}
      </p>
      <h2 id="doc-title" className="text-lg font-bold">
        {d.title}
      </h2>
      <p className="text-sm text-ink-muted">
        {t.requester}: {d.requester.name} · {d.requester.team}
      </p>
      <div className="my-2 flex flex-col gap-1">
        {d.story.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
      <p className="text-sm text-ink-muted">{t.tables}</p>
      <div className="mb-2 flex flex-col gap-2">
        {d.tables.map((tb) => (
          <ResultTable
            key={tb.name}
            caption={t.table(tb.name, tb.rows.length)}
            columns={tb.columns.map((c) => c.name)}
            rows={tb.rows}
          />
        ))}
      </div>
      <p className="mb-2 text-xs text-ink-muted">
        {t.hiddenNote(d.hidden.length)}
        {d.ordered ? ` ${t.orderedNote}` : ''}
      </p>
      <div className="mb-1 flex justify-end">
        {!locked && code !== d.starter && (
          <button
            type="button"
            className={`${btnSecondary} text-xs`}
            onClick={() => edit(d.starter)}
          >
            {id.data.editor.reset}
          </button>
        )}
      </div>
      <SqlEditor value={code} onChange={edit} readOnly={locked} />
      <button
        type="button"
        className={`${btnPrimary} mt-3`}
        disabled={locked || busy}
        onClick={run}
        data-testid="run-query"
      >
        <span aria-hidden="true">▶ </span>
        {busy ? r.running : r.button}
      </button>
      <div role="status" aria-live="polite" className="mt-2 flex flex-col gap-2">
        {outcome?.kind === 'timeout' && <p className="text-danger">{r.timeout}</p>}
        {outcome?.kind === 'failed' && <p className="text-danger">{r.failed}</p>}
        {result?.error?.kind === 'empty' && <p className="text-danger">{r.empty}</p>}
        {result?.error?.kind === 'sql' && (
          <p className="border-2 border-danger p-2 text-sm" data-testid="sql-error">
            <strong>
              <span aria-hidden="true">⚠ </span>
              {r.error}:
            </strong>{' '}
            <code>{result.error.text}</code>
            {hint && r.hints[hint] && <span className="mt-1 block">{r.hints[hint]}</span>}
          </p>
        )}
        {result && (
          <p
            className={'font-display ' + (all ? 'combo-pop text-lg text-safe' : '')}
            data-testid="query-summary"
            data-passed={passed}
            data-total={datasets.length}
          >
            {all ? `🎉 ${r.allPassed} ` : ''}
            {r.summary(passed, datasets.length)}
          </p>
        )}
      </div>
      {result && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-sm font-bold">
            <span aria-hidden="true">{sample?.passed ? '✓ ' : '✗ '}</span>
            {r.sample}: {sample?.passed ? r.match : r.mismatch}
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {sample?.got && (
              <ResultTable
                caption={r.got}
                columns={sample.got.columns}
                rows={sample.got.rows}
                empty={r.noRows}
                testId="query-got"
              />
            )}
            {sample?.expected && (
              <ResultTable
                caption={r.expected}
                columns={sample.expected.columns}
                rows={sample.expected.rows}
                empty={r.noRows}
                testId="query-expected"
              />
            )}
          </div>
          {sample?.got?.truncated && (
            <p className="text-xs text-ink-muted">{r.truncated(sample.got.rows.length)}</p>
          )}
          <ul className="flex flex-col gap-1 text-sm">
            {result.datasets.map((x, i) => {
              if (!x.hidden) return null;
              hiddenNo++;
              return (
                <li
                  key={i}
                  className={'border-2 px-2 py-1 ' + (x.passed ? 'border-safe' : 'border-danger')}
                  data-hidden-passed={x.passed}
                >
                  <span aria-hidden="true">{x.passed ? '✓ ' : '✗ '}</span>
                  {r.hiddenSet(hiddenNo)}: {x.passed ? r.match : r.mismatch}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {!locked && answer?.total === undefined && (
        <p className="mt-2 text-sm text-ink-muted">{r.notRunYet}</p>
      )}
    </article>
  );
}
