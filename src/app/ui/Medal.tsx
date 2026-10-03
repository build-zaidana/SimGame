import { MEDAL_H, MEDAL_W, medalPaths, type MedalTier } from './pixel/medal.ts';

/** Medali lencana; ikon di tengah, atau "?" bila belum didapat. */
export function Medal({
  tier,
  icon,
  locked,
  className = 'w-12',
}: {
  tier: MedalTier;
  icon: string;
  locked: boolean;
  className?: string;
}) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} aria-hidden="true">
      <svg viewBox={`0 0 ${MEDAL_W} ${MEDAL_H}`} className="sprite block h-auto w-full">
        {medalPaths(tier, locked).map(({ fill, d }) => (
          <path key={fill} fill={fill} d={d} />
        ))}
      </svg>
      <span
        className={
          'absolute inset-x-0 top-[38%] text-center leading-none ' +
          (locked ? 'font-display text-ink-muted' : '')
        }
        style={{ fontSize: '0.95em' }}
      >
        {locked ? '?' : icon}
      </span>
    </span>
  );
}
