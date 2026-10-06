import type { RobotFrame, RobotMap } from '../runner/robot.ts';

const TILE = 10;
/** Segitiga "hidung" robot per arah (koordinat dalam satu tile 10×10). */
const NOSE: Record<RobotFrame['dir'], string> = {
  N: '3,3 5,1 7,3',
  E: '7,3 9,5 7,7',
  S: '3,7 5,9 7,7',
  W: '3,3 1,5 3,7',
};

interface RobotMapViewProps {
  map: RobotMap;
  frame: RobotFrame;
  label: string;
}

/** Peta kisi pixel: dinding, lantai, paket, tujuan, dan robot. */
export function RobotMapView({ map, frame, label }: RobotMapViewProps) {
  const h = map.grid.length;
  const w = map.grid[0]?.length ?? 0;
  return (
    <svg
      viewBox={`0 0 ${w * TILE} ${h * TILE}`}
      className="sprite max-h-[45vh] w-full max-w-md border-2 border-ink/60 bg-[#1e2129]"
      role="img"
      aria-label={label}
      data-testid="robot-map"
      data-x={frame.x}
      data-y={frame.y}
      data-delivered={frame.delivered}
    >
      {map.grid.map((row, y) =>
        [...row].map((ch, x) => (
          <g key={`${x}-${y}`} transform={`translate(${x * TILE} ${y * TILE})`}>
            {ch === '#' ? (
              <>
                <rect width={TILE} height={TILE} fill="#3d4658" />
                <rect y={4} width={TILE} height={1} fill="#2a3140" />
                <rect x={4} width={1} height={4} fill="#2a3140" />
              </>
            ) : (
              <rect width={TILE} height={TILE} fill={(x + y) % 2 ? '#d9cba7' : '#e5d9bb'} />
            )}
            {ch === 'T' && (
              <>
                <rect x={3} y={1} width={1} height={8} fill="#2a2418" />
                <rect
                  x={4}
                  y={1}
                  width={4}
                  height={3}
                  fill={frame.delivered ? '#4ea889' : '#d0644e'}
                />
              </>
            )}
          </g>
        )),
      )}
      {frame.packages.map((p) => (
        <g key={`p-${p.x}-${p.y}`} transform={`translate(${p.x * TILE} ${p.y * TILE})`}>
          <rect x={2} y={3} width={6} height={5} fill="#b07a3c" />
          <rect x={2} y={3} width={6} height={1} fill="#d08a4e" />
          <rect x={4.5} y={3} width={1} height={5} fill="#f2c14e" />
        </g>
      ))}
      <g
        style={{ transform: `translate(${frame.x * TILE}px, ${frame.y * TILE}px)` }}
        className="robot-step"
        data-testid="robot"
        data-dir={frame.dir}
      >
        <rect x={1.5} y={1.5} width={7} height={7} fill={frame.crashed ? '#f07a6a' : '#8fd0fa'} />
        <rect x={1.5} y={1.5} width={7} height={1} fill="#ffffff" opacity={0.5} />
        <polygon points={NOSE[frame.dir]} fill="#14101c" />
        {frame.carrying > 0 && <rect x={3.5} y={3.5} width={3} height={3} fill="#b07a3c" />}
      </g>
    </svg>
  );
}
