import { useEffect, useRef, useState } from 'react';
import { t as id } from '../../../i18n/index.ts';
import { btnSecondary } from '../styles.ts';
import { formatClock } from './format.ts';
import type { ShiftSession } from '../../../engine/types.ts';
import { playSfx } from '../../sfx.ts';
import { useAppStore } from '../../store.ts';

/** Sisa waktu (bagian dari durasi shift) saat jam mulai berdenyut merah. */
const LOW_TIME = 0.15;

interface HudProps {
  deskTitle: string;
  session: ShiftSession;
  wallet: number;
  practice: boolean;
  /** Keputusan tepat beruntun; tampil mulai 2. */
  streak: number;
  onTogglePause(): void;
}

/** Meter kecil berbingkai pixel; nilai tetap ditulis sebagai angka di sebelahnya. */
function Meter({ value, className }: { value: number; className: string }) {
  return (
    <span className="inline-block h-2.5 w-14 border-2 border-ink/70 bg-bg" aria-hidden="true">
      <span
        className={`block h-full ${className}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  );
}

/** Perubahan kepercayaan melayang sebentar di atas angka (+1 / −15). */
function useDelta(value: number) {
  const prev = useRef(value);
  const [delta, setDelta] = useState<{ n: number; key: number } | null>(null);
  useEffect(() => {
    const n = value - prev.current;
    prev.current = value;
    if (n === 0) return;
    setDelta({ n, key: Date.now() });
    const t = window.setTimeout(() => setDelta(null), 1200);
    return () => window.clearTimeout(t);
  }, [value]);
  return delta;
}

export function Hud({ deskTitle, session, wallet, practice, streak, onTogglePause }: HudProps) {
  const progress = (100 * session.elapsedMs) / Math.max(1, session.durationMs);
  const waiting = session.cases.filter((c) => c.status === 'arrived').length;
  const trustDelta = useDelta(session.trust);
  const trustLow = session.trust < 50;
  const running = session.phase === 'working' || session.phase === 'inspecting';
  const timeLow = running && session.elapsedMs >= session.durationMs * (1 - LOW_TIME);
  const sound = useAppStore((s) => s.save?.profile.settings.sound ?? false);
  useEffect(() => {
    if (!timeLow || !sound) return;
    for (const d of [0, 0.25, 0.5]) playSfx('tick', d, 0.6);
  }, [timeLow, sound]);
  return (
    <header className="flex items-center gap-3 border-b-2 border-ink/40 bg-panel px-3 py-1 text-sm">
      <h1 className="hidden font-display text-accent sm:block">{deskTitle}</h1>
      {session.daily ? (
        <span
          className="border-2 border-accent px-1 font-display text-xs text-accent"
          title={id.daily.badgeLabel}
          data-testid="daily-badge"
        >
          <span aria-hidden="true">📅 </span>
          {id.daily.badge}
          <span className="sr-only">: {id.daily.badgeLabel}</span>
        </span>
      ) : (
        practice && (
          <span
            className="border-2 border-focus px-1 font-display text-xs text-focus"
            title={id.desk.practiceLabel}
            data-testid="practice-badge"
          >
            <span aria-hidden="true">🎯 </span>
            {id.desk.practiceBadge}
            <span className="sr-only">: {id.desk.practiceLabel}</span>
          </span>
        )
      )}
      <p className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 font-display">
        <span className="flex items-center gap-2">
          <span className="sr-only">{id.desk.clock} </span>
          <span
            className={
              'border-2 bg-[#0f1a14] px-1.5 tracking-widest ' +
              (timeLow
                ? 'clock-urgent border-danger text-[#f07a6a]'
                : 'border-ink/70 text-[#74cf92]')
            }
            data-testid="clock"
            data-low={timeLow || undefined}
          >
            {formatClock(session.elapsedMs, session.msPerGameMinute)}
          </span>
          {timeLow && (
            <span className="text-danger" title={id.desk.timeLow}>
              <span aria-hidden="true">⏰</span>
              <span className="sr-only">{id.desk.timeLow}</span>
            </span>
          )}
          <Meter value={progress} className="bg-ink-muted" />
          {session.paused && (
            <span className="blink text-accent" aria-hidden="true">
              ❚❚
            </span>
          )}
        </span>
        <span className="relative flex items-center gap-1.5">
          <span className="sr-only">{id.desk.trust} </span>
          <span aria-hidden="true" className={trustLow ? 'text-danger' : 'text-[#f07a6a]'}>
            ♥
          </span>
          <Meter value={session.trust} className={trustLow ? 'bg-danger' : 'bg-safe'} />
          <span data-testid="trust">{session.trust}</span>
          {trustDelta && (
            <span
              key={trustDelta.key}
              aria-hidden="true"
              className={
                'float-up absolute -top-1 right-0 text-xs ' +
                (trustDelta.n > 0 ? 'text-safe' : 'text-danger')
              }
            >
              {trustDelta.n > 0 ? `+${trustDelta.n}` : `−${-trustDelta.n}`}
            </span>
          )}
        </span>
        <span>
          <span className="sr-only">{id.desk.wallet} </span>
          <span aria-hidden="true" className="text-accent">
            ◉{' '}
          </span>
          <span aria-hidden="true">Rp </span>
          {wallet}
        </span>
        {streak >= 2 && (
          <span
            key={streak}
            className="combo-pop border-2 border-accent px-1 text-xs text-accent"
            data-testid="streak"
          >
            <span aria-hidden="true">🔥 </span>
            {id.desk.streak(streak)}
          </span>
        )}
        <span className="hidden sm:inline">
          <span aria-hidden="true">📥 </span>
          {id.desk.waiting(waiting)}
        </span>
        {session.paused && <span className="text-accent">{id.desk.paused}</span>}
      </p>
      <button
        type="button"
        className={btnSecondary}
        aria-pressed={session.paused}
        onClick={onTogglePause}
      >
        {session.paused ? id.desk.resume : id.desk.pause}
      </button>
    </header>
  );
}
