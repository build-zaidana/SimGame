import { PORTRAIT_SIZE, portraitPaths, type PortraitKind } from './pixel/portraits.ts';

/**
 * Potret pixel 32×32 yang digambar dari kode (tanpa file gambar). Wajah karyawan dibuat
 * deterministik dari namanya, jadi orang yang sama selalu tampil sama.
 */
export type AvatarKind = PortraitKind;

interface AvatarProps {
  kind: AvatarKind;
  /** Untuk 'person': nama orangnya. */
  seed?: string;
  className?: string;
}

export function Avatar({ kind, seed = '', className = 'size-14' }: AvatarProps) {
  return (
    <svg
      viewBox={`0 0 ${PORTRAIT_SIZE} ${PORTRAIT_SIZE}`}
      className={`sprite shrink-0 border-2 border-ink/60 bg-panel-2 ${className}`}
      aria-hidden="true"
      data-avatar={kind}
    >
      {portraitPaths(kind, seed).map(({ fill, d }) => (
        <path key={fill} fill={fill} d={d} />
      ))}
    </svg>
  );
}
