import { useEffect, useRef } from 'react';
import { playSfx } from '../../../app/sfx.ts';
import { useAppStore } from '../../../app/store.ts';
import { btnSecondary } from '../../../app/ui/styles.ts';
import { t as id } from '../../../i18n/index.ts';

export type ServerState = 'ok' | 'smoke' | 'fire' | 'down' | 'stable' | 'fixed';

export function serverState(health: number, rolledBack: boolean, fixed: boolean): ServerState {
  if (fixed) return 'fixed';
  if (rolledBack) return 'stable';
  if (health <= 0) return 'down';
  if (health < 35) return 'fire';
  if (health < 70) return 'smoke';
  return 'ok';
}

const LED: Record<ServerState, string> = {
  ok: '#74cf92',
  smoke: '#f2c14e',
  fire: '#f07a6a',
  down: '#3d4658',
  stable: '#8fd0fa',
  fixed: '#74cf92',
};

interface ServerRoomProps {
  service: string;
  health: number;
  state: ServerState;
  canRollback: boolean;
  onRollback(): void;
}

/** Rak server pixel yang berasap/terbakar sesuai kesehatan, plus bar kesehatan & tombol rollback. */
export function ServerRoom({ service, health, state, canRollback, onRollback }: ServerRoomProps) {
  const t = id.dev.incident;
  const sound = useAppStore((s) => s.save?.profile.settings.sound ?? false);
  const prev = useRef(state);
  // Alarm saat keadaan memburuk (sekali per perubahan).
  useEffect(() => {
    const worse = ['fire', 'down'].includes(state) && prev.current !== state;
    prev.current = state;
    if (worse && sound) for (const d of [0, 0.3, 0.6]) playSfx('wrong', d, 1.4);
  }, [state, sound]);
  const burning = state === 'smoke' || state === 'fire';
  const statusText = state === 'fixed' ? t.fixed : t.status[state];
  return (
    <section
      aria-label={t.label(service)}
      className={
        'mb-3 border-2 bg-[#161a24] p-2 text-[#e6e1d6] ' +
        (state === 'fire' || state === 'down' ? 'border-[#f07a6a] alarm-pulse' : 'border-ink/60')
      }
      data-testid="server-room"
      data-state={state}
      data-health={health}
    >
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 40 44" className="sprite h-20 w-auto shrink-0" aria-hidden="true">
          {burning && (
            <g className="smoke-rise">
              <rect x="12" y="2" width="6" height="4" fill="#5d6b82" opacity="0.7" />
              <rect x="20" y="0" width="8" height="5" fill="#5d6b82" opacity="0.5" />
            </g>
          )}
          <rect x="6" y="8" width="28" height="34" fill="#2a3140" />
          <rect x="6" y="8" width="28" height="2" fill="#3d4658" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(9 ${12 + i * 7})`}>
              <rect width="22" height="5" fill="#1e2129" />
              <rect
                x="2"
                y="2"
                width="2"
                height="1"
                fill={LED[state]}
                className={state === 'down' ? '' : 'blink-led'}
                style={{ animationDelay: `${i * 150}ms` }}
              />
              <rect
                x="6"
                y="2"
                width="2"
                height="1"
                fill={state === 'down' ? '#3d4658' : '#74cf92'}
              />
              <rect x="12" y="1" width="8" height="1" fill="#3d4658" />
              <rect x="12" y="3" width="8" height="1" fill="#3d4658" />
            </g>
          ))}
          {state === 'fire' && (
            <g className="flame-flicker">
              <rect x="10" y="30" width="4" height="8" fill="#f07a6a" />
              <rect x="11" y="27" width="2" height="4" fill="#f2c14e" />
              <rect x="25" y="28" width="5" height="10" fill="#f07a6a" />
              <rect x="26" y="25" width="3" height="4" fill="#f2c14e" />
            </g>
          )}
          {state === 'stable' && <rect x="16" y="2" width="8" height="5" fill="#8fd0fa" />}
        </svg>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm">
            <span aria-hidden="true">🖥 </span>
            {t.label(service)}
          </p>
          <p className="text-xs">
            {t.health}: <strong data-testid="server-health">{t.healthValue(health)}</strong>
          </p>
          <span
            className="mt-1 block h-3 w-full border-2 border-ink/70 bg-[#0f1a14]"
            aria-hidden="true"
          >
            <span
              className="block h-full transition-[width] duration-500"
              style={{
                width: `${health}%`,
                backgroundColor: LED[state === 'down' ? 'fire' : state],
              }}
            />
          </span>
          <p className="mt-1 text-xs font-bold" role="status">
            {statusText}
          </p>
        </div>
      </div>
      {canRollback && state !== 'fixed' && state !== 'stable' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`${btnSecondary} border-[#f07a6a] text-sm`}
            onClick={onRollback}
            data-testid="incident-rollback"
          >
            <span aria-hidden="true">⏪ </span>
            {t.rollback}
          </button>
          <span className="text-xs text-[#c9ccd6]">{t.rollbackHint}</span>
        </div>
      )}
      {!canRollback && (state === 'ok' || state === 'smoke' || state === 'fire') && (
        <p className="mt-2 text-xs text-[#c9ccd6]">{t.lockedHint}</p>
      )}
    </section>
  );
}

const CHIP_ICON: Record<ServerState, string> = {
  ok: '🖥',
  smoke: '💨',
  fire: '🔥',
  down: '⛔',
  stable: '🧊',
  fixed: '✅',
};

/** Indikator ringkas di dekat editor: di HP ruang server tergulir keluar layar saat mengetik. */
export function ServerHealthChip({ health, state }: { health: number; state: ServerState }) {
  const hot = state === 'fire' || state === 'down';
  return (
    <p
      className={
        'inline-flex items-center gap-2 border-2 bg-[#161a24] px-2 py-1 font-display text-sm text-[#e6e1d6] ' +
        (hot ? 'border-[#f07a6a] alarm-pulse' : 'border-ink/60')
      }
      data-testid="server-chip"
    >
      <span aria-hidden="true">{CHIP_ICON[state]}</span>
      {id.dev.incident.chip(health)}
      <span aria-hidden="true" className="inline-block h-2 w-12 bg-[#0d1017]">
        <span className="block h-full" style={{ width: `${health}%`, background: LED[state] }} />
      </span>
    </p>
  );
}
