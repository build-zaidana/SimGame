import { axisTop } from './axis.ts';

interface ChartViewProps {
  kind: 'bar' | 'line';
  title: string;
  unit: string;
  axisStart: number;
  points: readonly { label: string; value: number }[];
}

const W = 320;
const H = 180;
const PAD = { left: 40, right: 8, top: 12, bottom: 34 };

/**
 * Grafik sederhana (SVG) persis seperti yang dibuat rekan: sumbu Y mulai dari `axisStart`. Sumbu yang
 * tidak dimulai dari 0 sengaja ditampilkan apa adanya: itulah yang harus disadari pemain.
 */
export function ChartView({ kind, title, unit, axisStart, points }: ChartViewProps) {
  const top = axisTop(axisStart, Math.max(...points.map((p) => p.value)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const y = (v: number) =>
    PAD.top + plotH - (Math.max(0, v - axisStart) / Math.max(1e-9, top - axisStart)) * plotH;
  const slot = plotW / points.length;
  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const ticks = [axisStart, (axisStart + top) / 2, top];
  return (
    <figure className="my-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-md border-2 border-ink/40 bg-panel"
        role="img"
        aria-label={`${title} (${unit})`}
        data-testid="chart"
      >
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="currentColor"
              opacity="0.15"
            />
            <text x={PAD.left - 4} y={y(v) + 3} textAnchor="end" fontSize="9" fill="currentColor">
              {Math.round(v * 10) / 10}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + plotH} stroke="currentColor" />
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + plotH}
          y2={PAD.top + plotH}
          stroke="currentColor"
        />
        {kind === 'bar' ? (
          points.map((p, i) => (
            <rect
              key={i}
              x={x(i) - slot * 0.3}
              width={slot * 0.6}
              y={y(p.value)}
              height={PAD.top + plotH - y(p.value)}
              fill="#4e8fa8"
            />
          ))
        ) : (
          <polyline
            points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')}
            fill="none"
            stroke="#4e8fa8"
            strokeWidth="2.5"
          />
        )}
        {kind === 'line' &&
          points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="#4e8fa8" />)}
        {points.map((p, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - PAD.bottom + 14}
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
          >
            {p.label.length > 9 ? `${p.label.slice(0, 8)}…` : p.label}
          </text>
        ))}
        <text x={PAD.left} y={H - 6} fontSize="9" fill="currentColor" opacity="0.7">
          {unit}
        </text>
      </svg>
      <figcaption className="text-sm font-bold">{title}</figcaption>
    </figure>
  );
}
