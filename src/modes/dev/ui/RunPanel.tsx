import { useEffect, useState } from 'react';
import { playSfx } from '../../../app/sfx.ts';
import { useAppStore } from '../../../app/store.ts';
import { btnPrimary } from '../../../app/ui/styles.ts';
import { t as id } from '../../../i18n/index.ts';
import type { PyTest, RunResult } from '../runner/harness.ts';
import { runPython, warmUpPython, type RunOutcome } from '../runner/runPython.ts';
import { CustomerScene } from './CustomerScene.tsx';

interface RunPanelProps {
  code: string;
  tests: readonly PyTest[];
  disabled: boolean;
  /** Dipanggil sebelum menjalankan (mis. menyimpan draf kode). */
  beforeRun?(): void;
  /** Mencatat hasil tes ke sesi; tanpa ini = konsol coba-coba (CTF). */
  onResult?(passed: number, total: number): void;
  /** Baris error kode pemain, untuk ditandai di editor. */
  onErrorLine?(line: number | undefined): void;
  label?: string;
  /** Tampilkan tes sebagai antrean pelanggan aplikasi (tugas coding). */
  scene?: { file: string; seed: string } | undefined;
}

/** Tombol Jalankan + hasil tiap tes, keluaran print, dan error yang mudah dipahami. */
export function RunPanel({
  code,
  tests,
  disabled,
  beforeRun,
  onResult,
  onErrorLine,
  label = id.dev.run.button,
  scene,
}: RunPanelProps) {
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const sound = useAppStore((s) => s.save?.profile.settings.sound ?? false);
  useEffect(() => warmUpPython(), []);

  const run = () => {
    beforeRun?.();
    setBusy(true);
    void runPython(code, tests).then((o) => {
      setBusy(false);
      setOutcome(o);
      const result = o.kind === 'done' ? o.result : null;
      onErrorLine?.(result?.error?.line);
      if (!result || tests.length === 0) return;
      const passed = result.tests.filter((t) => t.passed).length;
      onResult?.(passed, tests.length);
      if (sound) playSfx(passed === tests.length ? 'combo' : 'wrong');
    });
  };

  const result: RunResult | null = outcome?.kind === 'done' ? outcome.result : null;
  const passed = result?.tests.filter((t) => t.passed).length ?? 0;
  const allPassed = !!result && tests.length > 0 && passed === tests.length;
  let hidden = 0;
  return (
    <section className="mt-3 flex flex-col gap-2" data-testid="run-panel">
      {scene && tests.length > 0 && (
        <CustomerScene file={scene.file} seed={scene.seed} tests={tests} result={result} />
      )}
      <button
        type="button"
        className={`${btnPrimary} self-start`}
        disabled={disabled || busy}
        onClick={run}
        data-testid="run-code"
      >
        <span aria-hidden="true">▶ </span>
        {busy ? id.dev.run.running : label}
      </button>
      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        {outcome?.kind === 'timeout' && <p className="text-danger">{id.dev.run.timeout}</p>}
        {outcome?.kind === 'failed' && <p className="text-danger">{id.dev.run.failed}</p>}
        {result && tests.length > 0 && (
          <p
            className={'font-display ' + (allPassed ? 'combo-pop text-lg text-safe' : 'text-ink')}
            data-testid="run-summary"
            data-passed={passed}
            data-total={tests.length}
          >
            {allPassed ? `🎉 ${id.dev.run.allPassed} ` : ''}
            {id.dev.run.summary(passed, tests.length)}
          </p>
        )}
      </div>
      {result?.error && (
        <div className="border-2 border-danger bg-panel p-2 text-sm" data-testid="run-error">
          <p className="font-display text-danger">
            <span aria-hidden="true">⚠ </span>
            {result.error.line ? id.dev.run.errorAt(result.error.line) : id.dev.run.error}
          </p>
          <p className="font-mono break-all">{result.error.text}</p>
          {result.error.hint && <p className="mt-1">💡 {id.dev.run.hints[result.error.hint]}</p>}
        </div>
      )}
      {result && tests.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm" data-testid="test-results">
          {result.tests.map((t, i) => {
            if (t.hidden) hidden++;
            return (
              <li
                key={i}
                className={'border-2 px-2 py-1 ' + (t.passed ? 'border-safe' : 'border-danger')}
                data-passed={t.passed}
              >
                <span aria-hidden="true" className={t.passed ? 'text-safe' : 'text-danger'}>
                  {t.passed ? '✓ ' : '✗ '}
                </span>
                {t.hidden ? id.dev.run.hiddenTest(hidden) : t.name}
                {!t.passed && !t.hidden && !result.error && t.got !== undefined && (
                  <span className="block font-mono text-xs break-all" data-testid="got-expected">
                    {id.dev.run.gotExpected(t.got, t.expected ?? '')}
                  </span>
                )}
                {!t.passed && t.message && !result.error && t.got === undefined && (
                  <span className="block font-mono text-xs break-all text-ink-muted">
                    {t.message}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {result && (
        <div className="text-sm">
          <p className="text-ink-muted">{id.dev.run.output}</p>
          <pre
            className="max-h-40 overflow-auto border-2 border-ink/40 bg-[#0f1a14] p-2 font-mono text-xs whitespace-pre-wrap text-[#74cf92]"
            data-testid="run-output"
          >
            {result.output.length ? result.output.join('\n') : id.dev.run.noOutput}
            {result.truncated && `\n${id.dev.run.truncated}`}
          </pre>
        </div>
      )}
    </section>
  );
}
