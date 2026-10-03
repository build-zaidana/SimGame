import { id } from '../../../i18n/id.ts';
import {
  DESK_HEIGHT,
  DESK_TOP,
  DESK_W,
  DESK_X,
  OFFICE_H as H,
  OFFICE_W as W,
  officePaths,
} from '../pixel/office.ts';

export interface DeskHotspot {
  label: string;
  available: boolean;
  onEnter?: () => void;
  disabled?: boolean;
}

/** Ilustrasi kantor + hotspot meja (tombol nyata, bisa difokus dengan keyboard). */
export function OfficeIllustration({ desks }: { desks: DeskHotspot[] }) {
  return (
    <div
      className="relative w-full border-2 border-ink/40 pixel-shadow"
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      <svg
        className="sprite block h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        focusable="false"
      >
        {officePaths(0).map(({ fill, d }) => (
          <path key={fill} fill={fill} d={d} />
        ))}
      </svg>
      {desks.slice(0, DESK_X.length).map((d, i) => (
        <button
          key={d.label}
          type="button"
          disabled={!d.available || d.disabled}
          onClick={d.onEnter}
          aria-label={d.available ? d.label : `${d.label}: ${id.hub.comingSoon}`}
          className="group absolute flex flex-col items-center justify-end focus-visible:outline-4 focus-visible:outline-focus disabled:cursor-not-allowed"
          style={{
            left: `${((DESK_X[i] ?? 0) / W) * 100}%`,
            top: `${(DESK_TOP / H) * 100}%`,
            width: `${(DESK_W / W) * 100}%`,
            height: `${(DESK_HEIGHT / H) * 100}%`,
          }}
        >
          <span
            aria-hidden="true"
            className={
              'max-w-full truncate border border-ink/60 px-1 font-display text-[0.65rem] leading-tight sm:text-xs ' +
              (d.available ? 'bg-accent text-bg group-hover:bg-ink' : 'bg-panel text-ink-muted')
            }
          >
            {d.available ? '▶ ' : '🔒 '}
            {d.label}
          </span>
        </button>
      ))}
    </div>
  );
}
