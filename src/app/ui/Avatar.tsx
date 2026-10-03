import { hashString } from '../../engine/rng.ts';

/**
 * Potret pixel 12×14 yang digambar dari kode (tanpa file gambar). Wajah karyawan dibuat
 * deterministik dari namanya, jadi orang yang sama selalu tampil sama.
 */
export type AvatarKind = 'person' | 'system' | 'rani' | 'kelabu';

const SKIN = ['#f1c9a5', '#d9a77c', '#b98256', '#8d5a3b'];
const HAIR = ['#2a1d16', '#4a3022', '#1b1b22', '#6b4a2b', '#3a2a40'];
const CLOTH = ['#4e7fd0', '#d0644e', '#4ea889', '#c9a23f', '#8e63c4', '#5d6b82'];
const HIJAB = ['#c95d7a', '#4e8fa8', '#7c6bc4', '#5f9e6e', '#b07a3c'];

type Rect = [x: number, y: number, w: number, h: number, fill: string];

const pick = <T,>(xs: readonly T[], n: number): T => xs[n % xs.length] as T;

function face(skin: string, rects: Rect[]) {
  rects.push([3, 3, 6, 7, skin], [5, 10, 2, 1, skin]);
  rects.push([4, 6, 1, 1, '#1b1b22'], [7, 6, 1, 1, '#1b1b22'], [5, 8, 2, 1, '#8a3b3b']);
}

function person(seed: string): Rect[] {
  const h = hashString(seed);
  const skin = pick(SKIN, h);
  const hair = pick(HAIR, h >>> 3);
  const cloth = pick(CLOTH, h >>> 6);
  const style = (h >>> 9) % 4;
  const r: Rect[] = [[1, 11, 10, 3, cloth]];
  if (style === 3) {
    // Berhijab.
    const scarf = pick(HIJAB, h >>> 12);
    r.push([2, 2, 8, 10, scarf], [1, 10, 10, 2, scarf]);
    face(skin, r);
    r.push([3, 3, 6, 1, scarf]);
    return r;
  }
  face(skin, r);
  r.push([3, 2, 6, 2, hair], [3, 4, 1, 1, hair], [8, 4, 1, 1, hair]);
  if (style === 1) r.push([2, 3, 1, 7, hair], [9, 3, 1, 7, hair]);
  if (style === 2) r.push([5, 1, 2, 1, hair]);
  if ((h >>> 15) % 3 === 0)
    r.push([3, 6, 6, 1, '#1b1b22'], [4, 6, 1, 1, '#8fd0fa'], [7, 6, 1, 1, '#8fd0fa']);
  return r;
}

function system(): Rect[] {
  return [
    [1, 2, 10, 8, '#5d6b82'],
    [2, 3, 8, 6, '#0f1a14'],
    [3, 5, 2, 1, '#74cf92'],
    [7, 5, 2, 1, '#74cf92'],
    [4, 7, 4, 1, '#74cf92'],
    [5, 10, 2, 2, '#5d6b82'],
    [3, 12, 6, 2, '#3d4658'],
  ];
}

function rani(): Rect[] {
  const r: Rect[] = [
    [1, 11, 10, 3, '#2f6f9f'],
    [2, 2, 8, 10, '#3f9a8a'],
    [1, 10, 10, 2, '#3f9a8a'],
  ];
  face('#d9a77c', r);
  r.push(
    [3, 3, 6, 1, '#3f9a8a'],
    [3, 6, 6, 1, '#1b1b22'],
    [4, 6, 1, 1, '#8fd0fa'],
    [7, 6, 1, 1, '#8fd0fa'],
  );
  r.push([5, 12, 2, 1, '#f2c14e']);
  return r;
}

function kelabu(): Rect[] {
  return [
    [1, 11, 10, 3, '#4a4f5c'],
    [2, 1, 8, 11, '#6b7080'],
    [3, 3, 6, 7, '#2a2d36'],
    [4, 6, 1, 1, '#f4efe4'],
    [7, 6, 1, 1, '#f4efe4'],
    [5, 8, 2, 1, '#6b7080'],
    [10, 4, 1, 1, '#8fd0fa'],
    [0, 8, 1, 1, '#f07a6a'],
  ];
}

interface AvatarProps {
  kind: AvatarKind;
  /** Untuk 'person': nama orangnya. */
  seed?: string;
  className?: string;
}

export function Avatar({ kind, seed = '', className = 'size-14' }: AvatarProps) {
  const rects =
    kind === 'system'
      ? system()
      : kind === 'rani'
        ? rani()
        : kind === 'kelabu'
          ? kelabu()
          : person(seed);
  return (
    <svg
      viewBox="0 0 12 14"
      className={`sprite shrink-0 border-2 border-ink/60 bg-panel-2 ${className}`}
      aria-hidden="true"
      data-avatar={kind}
    >
      {rects.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </svg>
  );
}
