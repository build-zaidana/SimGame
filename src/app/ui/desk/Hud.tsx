import { id } from '../../../i18n/id.ts';
import { btnSecondary } from '../styles.ts';
import { formatClock } from './format.ts';
import type { ShiftSession } from '../../../engine/types.ts';

interface HudProps {
  deskTitle: string;
  session: ShiftSession;
  wallet: number;
  onTogglePause(): void;
}

export function Hud({ deskTitle, session, wallet, onTogglePause }: HudProps) {
  return (
    <header className="flex items-center gap-3 border-b-2 border-ink/40 bg-panel px-4 py-1 text-sm">
      <h1 className="hidden font-display text-accent sm:block">{deskTitle}</h1>
      <p className="flex flex-1 flex-wrap items-center gap-x-4 font-display">
        <span>
          <span className="sr-only">{id.desk.clock} </span>
          <span aria-hidden="true">🕘 </span>
          <span data-testid="clock">{formatClock(session.elapsedMs, session.msPerGameMinute)}</span>
        </span>
        <span>
          <span className="sr-only">{id.desk.trust} </span>
          <span aria-hidden="true">♥ </span>
          <span data-testid="trust">{session.trust}</span>
        </span>
        <span>
          <span className="sr-only">{id.desk.wallet} </span>
          <span aria-hidden="true">Rp </span>
          {wallet}
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
