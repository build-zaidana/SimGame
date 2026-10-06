import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../../../../app/sfx.ts';
import { useAppStore } from '../../../../app/store.ts';
import { prefersReducedMotion } from '../../../../app/ui/motion.ts';
import { btnPrimary, btnSecondary } from '../../../../app/ui/styles.ts';
import { t as id } from '../../../../i18n/index.ts';
import type { DocumentProps } from '../../../contract.ts';
import { replay, type RobotResult } from '../../runner/robot.ts';
import { runRobotProgram, warmUpPython, type RobotOutcome } from '../../runner/runPython.ts';
import { CodeEditor } from '../../ui/CodeEditor.tsx';
import { RobotMapView } from '../../ui/RobotMapView.tsx';
import type { RobotCase } from './schema.ts';

const STEP_MS = 220;
const SAVE_DRAFT_MS = 500;

export function RobotDocument({ data, locked, answer, onAnswer, onRun }: DocumentProps<RobotCase>) {
  const d = data.data;
  const t = id.dev.robot;
  const [code, setCode] = useState(answer?.text ?? d.starter);
  const [mapIndex, setMapIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<RobotOutcome | null>(null);
  const [step, setStep] = useState(0);
  const sound = useAppStore((s) => s.save?.profile.settings.sound ?? false);
  const saved = useRef(answer?.text ?? d.starter);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => warmUpPython(), []);

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

  const result: RobotResult | null = outcome?.kind === 'done' ? outcome.result : null;
  const map = d.maps[mapIndex] ?? d.maps[0]!;
  const trace = result?.maps[mapIndex]?.trace ?? [];
  const frames = replay(map, trace);
  const instant = prefersReducedMotion();
  const frame = frames[instant ? frames.length - 1 : Math.min(step, frames.length - 1)]!;

  // Animasi langkah robot; animasi dikurangi = langsung ke posisi akhir.
  useEffect(() => {
    if (!result || instant) return;
    const timer = window.setInterval(() => {
      setStep((s) => {
        if (s + 1 >= frames.length) window.clearInterval(timer);
        if (sound && s + 1 < frames.length) playSfx('tick', 0, 0.8 + (s % 4) * 0.1);
        return s + 1;
      });
    }, STEP_MS);
    return () => window.clearInterval(timer);
    // frames dihitung ulang tiap render; cukup bergantung pada hasil & peta yang dipilih.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, mapIndex, instant]);

  const run = () => {
    flush();
    setStep(0);
    setBusy(true);
    void runRobotProgram(code, d.maps).then((o) => {
      setBusy(false);
      setOutcome(o);
      if (o.kind !== 'done') return;
      // Di HP peta ada jauh di atas tombol Jalankan: gulir ke peta supaya robotnya terlihat bergerak.
      stage.current?.scrollIntoView({ block: 'center', behavior: instant ? 'auto' : 'smooth' });
      const passed = o.result.maps.filter((m) => m.passed).length;
      onRun?.(passed, d.maps.length);
      // Tampilkan peta pertama yang gagal (atau tetap di peta ini bila semua berhasil).
      const firstFail = o.result.maps.findIndex((m) => !m.passed);
      if (firstFail >= 0) {
        setStep(0);
        setMapIndex(firstFail);
      }
      if (sound) playSfx(passed === d.maps.length ? 'combo' : 'wrong', 0.2);
    });
  };

  const edit = (text: string) => {
    setCode(text);
    if (answer?.total !== undefined) flush(text);
  };
  const passed = result?.maps.filter((m) => m.passed).length ?? 0;
  const all = !!result && passed === d.maps.length;
  const mapResult = result?.maps[mapIndex];
  return (
    <article aria-labelledby="doc-title" className="border-2 border-ink/40 bg-bg p-3">
      <p className="font-display text-accent">
        <span aria-hidden="true">🤖 </span>
        {t.heading}
      </p>
      <h2 id="doc-title" className="text-lg font-bold">
        {d.title}
      </h2>
      <p className="text-sm text-ink-muted">
        {id.dev.coding.requester}: {d.requester.name} · {d.requester.team}
      </p>
      <div className="my-2 flex flex-col gap-1">
        {d.story.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
      <div ref={stage}>
        {d.maps.length > 1 && (
          <div role="tablist" aria-label={t.mapsLabel} className="mb-1 flex gap-1">
            {d.maps.map((_, i) => {
              const r = result?.maps[i];
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === mapIndex}
                  className={`${btnSecondary} text-sm ${i === mapIndex ? 'border-accent' : ''}`}
                  onClick={() => {
                    setStep(0);
                    setMapIndex(i);
                  }}
                  data-map-tab={i}
                >
                  {r ? (r.passed ? '✓ ' : '✗ ') : ''}
                  {t.mapTab(i + 1)}
                </button>
              );
            })}
          </div>
        )}
        <RobotMapView
          map={map}
          frame={frame}
          label={t.mapAlt(mapIndex + 1, frame.delivered, frames[0]!.packages.length)}
        />
        <p className="mt-1 text-xs text-ink-muted">{t.legend}</p>
        <p className="text-sm font-display" aria-hidden="true">
          📦 {t.delivered(frame.delivered, frames[0]!.packages.length)}
        </p>
      </div>
      {mapResult?.error && (instant || step >= frames.length - 1) && (
        <p className="mt-1 border-2 border-danger p-2 text-sm" data-testid="robot-error">
          <span aria-hidden="true">⚠ </span>
          {mapResult.error.line ? `${id.dev.run.errorAt(mapResult.error.line)}: ` : ''}
          {mapResult.error.text}
        </p>
      )}
      <div className="mt-3">
        <CodeEditor
          value={code}
          onChange={edit}
          label={id.dev.editor.codeLabel('robot.py')}
          readOnly={locked}
          errorLine={mapResult?.error?.line}
          testId="code-editor"
          commands={t.commandList}
          commandsLabel={t.commands}
        />
      </div>
      <button
        type="button"
        className={`${btnPrimary} mt-3`}
        disabled={locked || busy}
        onClick={run}
        data-testid="run-code"
      >
        <span aria-hidden="true">▶ </span>
        {busy ? id.dev.run.running : t.run}
      </button>
      <div role="status" aria-live="polite" className="mt-2">
        {outcome?.kind === 'timeout' && <p className="text-danger">{id.dev.run.timeout}</p>}
        {outcome?.kind === 'failed' && <p className="text-danger">{id.dev.run.failed}</p>}
        {result && (
          <p
            className={'font-display ' + (all ? 'combo-pop text-lg text-safe' : '')}
            data-testid="run-summary"
            data-passed={passed}
            data-total={d.maps.length}
          >
            {all ? `🎉 ${t.allPassed} ` : ''}
            {t.summary(passed, d.maps.length)}
          </p>
        )}
      </div>
      {!locked && answer?.total === undefined && (
        <p className="mt-2 text-sm text-ink-muted">{id.dev.run.notRunYet}</p>
      )}
    </article>
  );
}
