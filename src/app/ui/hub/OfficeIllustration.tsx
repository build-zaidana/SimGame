import { id } from '../../../i18n/id.ts';

/** Grid pixel 64×36. Semua gambar dibuat sendiri (lihat public/assets/CREDITS.md). */
const W = 64;
const H = 36;
type Px = [x: number, y: number, w: number, h: number, fill: string];

const C = {
  wall: '#2d3549',
  wallDark: '#232a3a',
  floor: '#3b3328',
  floorLine: '#4a4033',
  sky: '#8fd0fa',
  city: '#3a4a6a',
  frame: '#161a24',
  wood: '#8a6a45',
  woodDark: '#5e4630',
  monitor: '#0b0d13',
  off: '#3a4258',
  on: '#74cf92',
  chair: '#4b556e',
  skin: '#e0b48a',
  hair: '#2a1d14',
  shirt: '#f07a6a',
  pants: '#232a3a',
  accent: '#f2c14e',
  plant: '#4f9e64',
  pot: '#b0603e',
};

export const DESK_X = [4, 19, 34, 49] as const;
const DESK_W = 12;

function desk(x: number, active: boolean): Px[] {
  return [
    [x + 4, 26, 4, 4, C.chair],
    [x + 3, 14, 6, 5, C.monitor],
    [x + 4, 15, 4, 3, active ? C.on : C.off],
    [x + 5, 19, 2, 2, C.monitor],
    [x, 21, DESK_W, 2, C.wood],
    [x + 1, 23, 1, 5, C.woodDark],
    [x + DESK_W - 2, 23, 1, 5, C.woodDark],
    [x + 1, 20, 3, 1, C.accent],
  ];
}

const SCENE: Px[] = [
  [0, 0, W, 21, C.wall],
  [0, 19, W, 2, C.wallDark],
  [0, 21, W, H - 21, C.floor],
  ...[25, 30, 35].map((y): Px => [0, y, W, 1, C.floorLine]),
  // jendela & kota
  [4, 2, 14, 10, C.frame],
  [5, 3, 12, 8, C.sky],
  [5, 7, 3, 4, C.city],
  [9, 5, 3, 6, C.city],
  [13, 8, 4, 3, C.city],
  [10, 3, 1, 8, C.frame],
  // papan "SOC"
  [24, 3, 16, 7, C.frame],
  [25, 4, 14, 5, C.wallDark],
  [27, 5, 2, 3, C.on],
  [30, 5, 2, 3, C.on],
  [33, 5, 2, 3, C.on],
  [36, 5, 1, 3, C.on],
  // jam dinding
  [48, 3, 6, 6, C.frame],
  [49, 4, 4, 4, C.accent],
  [50, 5, 1, 2, C.frame],
  // tanaman
  [60, 13, 3, 6, C.plant],
  [60, 19, 3, 2, C.pot],
  ...DESK_X.flatMap((x, i) => desk(x, i === 0)),
  // Mbak Rani berdiri di samping meja SOC
  [16, 18, 2, 1, C.hair],
  [16, 19, 2, 2, C.skin],
  [15, 21, 4, 4, C.shirt],
  [16, 25, 1, 4, C.pants],
  [17, 25, 1, 4, C.pants],
];

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
        {SCENE.map(([x, y, w, h, fill], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
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
            top: `${(12 / H) * 100}%`,
            width: `${(DESK_W / W) * 100}%`,
            height: `${(20 / H) * 100}%`,
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
