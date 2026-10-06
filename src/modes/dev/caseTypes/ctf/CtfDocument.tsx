import { useState } from 'react';
import { btnSecondary } from '../../../../app/ui/styles.ts';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import { CodeEditor } from '../../ui/CodeEditor.tsx';
import { RunPanel } from '../../ui/RunPanel.tsx';
import type { CtfCase } from './schema.ts';

export function CtfDocument({ data, locked, answer, onAnswer, onRun }: DocumentProps<CtfCase>) {
  const d = data.data;
  const t = id.dev.ctf;
  const [scratch, setScratch] = useState(d.scratch);
  const [flag, setFlag] = useState(answer?.text ?? '');
  const [checked, setChecked] = useState<boolean | null>(null);
  const check = () => {
    const ok = flag.trim() === d.flag;
    setChecked(ok);
    onAnswer?.(flag);
    onRun?.(ok ? 1 : 0, 1);
  };
  return (
    <article aria-labelledby="doc-title" className="border-2 border-ink/40 bg-bg p-3">
      <p className="font-display text-accent">
        <span aria-hidden="true">🚩 </span>
        {t.heading}
      </p>
      <h2 id="doc-title" className="text-lg font-bold">
        {d.title}
      </h2>
      <div className="my-2 flex flex-col gap-1">
        {d.story.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
      <p className="text-sm text-ink-muted">{t.artifacts}</p>
      {d.artifacts.map((a, i) => (
        <figure key={i} className="mb-2">
          <figcaption className="font-mono text-sm font-bold">{a.label}</figcaption>
          <pre
            className={
              'overflow-x-auto border-2 border-ink/40 p-2 text-sm whitespace-pre-wrap break-all ' +
              (a.kind === 'code' ? 'bg-[#1e2129] font-mono text-[#e6e1d6]' : 'bg-panel')
            }
          >
            {a.content}
          </pre>
        </figure>
      ))}
      <p className="mt-3 text-sm text-ink-muted">{t.scratch}</p>
      <CodeEditor
        value={scratch}
        onChange={setScratch}
        label={t.scratch}
        readOnly={locked}
        testId="scratch-editor"
      />
      <RunPanel code={scratch} tests={[]} disabled={locked} label={id.dev.run.scratch} />
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          {t.flagLabel}
          <input
            type="text"
            value={flag}
            disabled={locked}
            onChange={(e) => {
              setFlag(e.target.value);
              setChecked(null);
            }}
            placeholder="FLAG{...}"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            className="min-h-11 border-2 border-ink/60 bg-panel px-2 font-mono"
            data-testid="flag-input"
          />
        </label>
        <button
          type="button"
          className={btnSecondary}
          disabled={locked || flag.trim() === ''}
          onClick={check}
          data-testid="flag-check"
        >
          {t.check}
        </button>
      </div>
      <p role="status" className="mt-1 text-sm" data-testid="flag-result">
        {checked === true && <span className="combo-pop text-safe">🎉 {t.right}</span>}
        {checked === false && <span className="text-danger">✗ {t.wrong}</span>}
      </p>
    </article>
  );
}
