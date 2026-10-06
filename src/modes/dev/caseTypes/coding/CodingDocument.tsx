import { useEffect, useRef, useState } from 'react';
import { btnSecondary } from '../../../../app/ui/styles.ts';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import { CodeEditor } from '../../ui/CodeEditor.tsx';
import { RunPanel } from '../../ui/RunPanel.tsx';
import { ServerRoom, serverState } from '../../ui/ServerRoom.tsx';
import { serverHealth } from '../../incident.ts';
import type { CodingCase } from './schema.ts';

/** Jeda menyimpan draf kode ke sesi (setiap aksi menulis save). */
const SAVE_DRAFT_MS = 500;

export function CodingDocument({
  data,
  locked,
  answer,
  onAnswer,
  onRun,
  clock,
  onRollback,
}: DocumentProps<CodingCase>) {
  const d = data.data;
  const t = id.dev.coding;
  const [code, setCode] = useState(answer?.text ?? d.starter);
  const [errorLine, setErrorLine] = useState<number | undefined>();
  const saved = useRef(answer?.text ?? d.starter);

  const flush = (text = code) => {
    if (text === saved.current) return;
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
    setErrorLine(undefined);
    // Hasil tes lama tidak berlaku untuk kode yang diubah: batalkan segera (bukan setelah jeda),
    // supaya Kirim Solusi tidak memakai hasil kode sebelumnya.
    if (answer?.total !== undefined) flush(text);
  };
  const visible = d.tests.filter((x) => !x.hidden);
  const incident = d.incident;
  const health =
    incident && clock
      ? serverHealth({
          openedAtMs: clock.openedAtMs ?? clock.nowMs,
          nowMs: clock.nowMs,
          rolledBackAtMs: answer?.rolledBackAtMs,
          drainPerSecond: incident.drainPerSecond,
        })
      : 100;
  const fixed = !!answer?.total && answer.passed === answer.total;
  return (
    <article aria-labelledby="doc-title" className="border-2 border-ink/40 bg-bg p-3">
      <p className="font-display text-accent">
        <span aria-hidden="true">{d.task === 'fix' ? '🐞 ' : '🧩 '}</span>
        {d.task === 'fix' ? t.fixHeading : t.buildHeading}
      </p>
      <h2 id="doc-title" className="text-lg font-bold">
        {d.title}
      </h2>
      {incident && (
        <ServerRoom
          service={incident.service}
          health={health}
          state={serverState(health, answer?.rolledBackAtMs !== undefined, fixed)}
          canRollback={!locked && (clock?.shiftOrder ?? 1) >= 3}
          onRollback={() => onRollback?.()}
        />
      )}
      <p className="text-sm text-ink-muted">
        {t.requester}: {d.requester.name} · {d.requester.team}
      </p>
      <div className="my-2 flex flex-col gap-1">
        {d.story.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
      <p className="text-sm text-ink-muted">{t.tests}</p>
      <ul className="mb-2 list-disc pl-5 font-mono text-xs">
        {visible.map((x) => (
          <li key={x.name}>
            {x.name}: <code>{x.code}</code>
          </li>
        ))}
        {visible.length < d.tests.length && (
          <li className="font-sans">{id.dev.run.hiddenCount(d.tests.length - visible.length)}</li>
        )}
      </ul>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-mono text-sm">
          {t.file}: <strong>{d.file}</strong>
        </p>
        {!locked && code !== d.starter && (
          <button
            type="button"
            className={`${btnSecondary} text-xs`}
            onClick={() => edit(d.starter)}
          >
            {id.dev.editor.reset}
          </button>
        )}
      </div>
      <CodeEditor
        value={code}
        onChange={edit}
        label={id.dev.editor.codeLabel(d.file)}
        readOnly={locked}
        errorLine={errorLine}
        testId="code-editor"
      />
      <RunPanel
        code={code}
        tests={d.tests}
        disabled={locked}
        beforeRun={() => flush()}
        onResult={(passed, total) => onRun?.(passed, total)}
        onErrorLine={setErrorLine}
        scene={{ file: d.file, seed: data.id }}
      />
      {!locked && answer?.total === undefined && (
        <p className="mt-2 text-sm text-ink-muted">{id.dev.run.notRunYet}</p>
      )}
    </article>
  );
}
