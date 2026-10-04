import { hashString } from '../../../engine/rng.ts';
import { PixelCanvas } from './canvas.ts';

/** Potret 32×32. Cahaya dari kiri atas; outline gelap seperti sprite game. */
export const PORTRAIT_SIZE = 32;
export type PortraitKind = 'person' | 'system' | 'rani' | 'kelabu' | 'joko';

const OUTLINE = '#14101c';
const SKIN = ['#f3cfac', '#dcab80', '#bd875c', '#8f5c3c'];
const HAIR = ['#2a1d16', '#4a3022', '#1b1b22', '#6b4a2b', '#3a2a40', '#7a5230'];
const CLOTH = ['#4e7fd0', '#d0644e', '#4ea889', '#c9a23f', '#8e63c4', '#5d6b82', '#3f8fa8'];
const HIJAB = ['#c95d7a', '#4e8fa8', '#7c6bc4', '#5f9e6e', '#b07a3c', '#d08a4e'];

/** Menggelapkan (f < 1) atau mencerahkan (f > 1) warna hex. */
export function tint(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) =>
    Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const pick = <T>(xs: readonly T[], n: number): T => xs[n % xs.length] as T;
const shaded = (c: string) => ({ shade: tint(c, 0.78), light: tint(c, 1.18) });

function shoulders(p: PixelCanvas, cloth: string) {
  p.ellipse(16, 33.5, 13.5, 8.5, cloth, shaded(cloth));
  // Kerah V.
  p.line(13, 25, 16, 28, tint(cloth, 0.7)).line(19, 25, 16, 28, tint(cloth, 0.7));
}

function neckAndHead(p: PixelCanvas, skin: string) {
  p.rect(13, 20, 6, 6, tint(skin, 0.82));
  p.ellipse(8.6, 15.5, 1.6, 2.2, skin, { shade: tint(skin, 0.82) });
  p.ellipse(23.4, 15.5, 1.6, 2.2, skin, { shade: tint(skin, 0.82) });
  p.ellipse(16, 14.5, 7.6, 8.6, skin, { shade: tint(skin, 0.86), light: tint(skin, 1.08) });
}

function faceFeatures(p: PixelCanvas, skin: string, brow: string, seed: number) {
  const pupil = '#1b1b22';
  // Mata: putih + pupil, dengan kilau 1 px.
  p.rect(11, 14, 3, 2, '#f8f4ea').rect(18, 14, 3, 2, '#f8f4ea');
  p.rect(12, 14, 1, 2, pupil).rect(19, 14, 1, 2, pupil);
  p.set(13, 15, '#d8d2c4').set(20, 15, '#d8d2c4');
  p.rect(11, 12, 3, 1, brow).rect(18, 12, 3, 1, brow);
  // Hidung & mulut.
  p.set(16, 16, tint(skin, 0.78)).set(16, 17, tint(skin, 0.78)).set(15, 18, tint(skin, 0.86));
  const mouth = '#8a3b3b';
  if (seed % 3 === 0) {
    p.rect(14, 20, 4, 1, mouth).set(13, 19, mouth).set(18, 19, mouth);
  } else {
    p.rect(14, 20, 4, 1, mouth).set(15, 21, '#c2575a').set(16, 21, '#c2575a');
  }
  if (seed % 4 === 1) p.set(11, 18, '#e58a7a').set(20, 18, '#e58a7a');
}

function glasses(p: PixelCanvas, frame: string) {
  for (const x0 of [10, 17]) {
    p.line(x0, 13, x0 + 4, 13, frame).line(x0, 16, x0 + 4, 16, frame);
    p.line(x0, 13, x0, 16, frame).line(x0 + 4, 13, x0 + 4, 16, frame);
  }
  p.set(15, 14, frame).set(16, 14, frame);
}

function hijab(p: PixelCanvas, scarf: string, skin: string) {
  p.ellipse(16, 15, 10.5, 11.5, scarf, shaded(scarf));
  p.ellipse(16, 27, 12, 6, scarf, { shade: tint(scarf, 0.78) });
  p.line(7, 19, 10, 26, tint(scarf, 0.7)).line(25, 19, 22, 26, tint(scarf, 0.7));
  p.ellipse(16, 15, 6.4, 7.6, skin, { shade: tint(skin, 0.86), light: tint(skin, 1.08) });
}

function hair(p: PixelCanvas, color: string, style: number) {
  const s = shaded(color);
  const top = (x: number, y: number) => y <= 11 || x < 9 || x > 22;
  if (style === 1) {
    // Rambut panjang: sudah digambar di belakang kepala; di sini poni menyamping.
    p.ellipse(16, 10, 8.6, 6.4, color, { ...s, clip: (x, y) => top(x, y) && y <= 13 });
    p.ellipse(12, 10, 5, 3.4, color, s);
    return;
  }
  if (style === 2) p.ellipse(16, 3.5, 3.6, 3.2, color, s); // sanggul
  if (style === 4) {
    // Ikal.
    for (const [x, y] of [
      [9, 8],
      [12, 6],
      [16, 5],
      [20, 6],
      [23, 8],
      [10, 11],
      [22, 11],
    ] as const)
      p.ellipse(x, y, 2.8, 2.8, color, s);
    return;
  }
  p.ellipse(16, 10, 8.6, 6.2, color, { ...s, clip: (x, y) => top(x, y) && y <= 12 });
  if (style === 3) p.line(18, 6, 22, 10, s.shade); // belahan samping
}

function person(seed: string): PixelCanvas {
  const h = hashString(seed);
  const skin = pick(SKIN, h);
  const hairColor = pick(HAIR, h >>> 3);
  const cloth = pick(CLOTH, h >>> 6);
  const style = (h >>> 9) % 6;
  const p = new PixelCanvas(32, 32);
  if (style === 5) {
    shoulders(p, cloth);
    hijab(p, pick(HIJAB, h >>> 12), skin);
    faceFeatures(p, skin, tint(skin, 0.55), h >>> 14);
  } else {
    if (style === 1) p.ellipse(16, 17, 10, 10.5, hairColor, shaded(hairColor));
    shoulders(p, cloth);
    neckAndHead(p, skin);
    hair(p, hairColor, style);
    faceFeatures(p, skin, tint(hairColor, 0.8), h >>> 14);
  }
  if ((h >>> 17) % 3 === 0) glasses(p, '#1b1b22');
  return p.outline(OUTLINE);
}

function rani(): PixelCanvas {
  const p = new PixelCanvas(32, 32);
  shoulders(p, '#2f6f9f');
  hijab(p, '#3f9a8a', '#dcab80');
  faceFeatures(p, '#dcab80', '#6b4a2b', 0);
  glasses(p, '#1b1b22');
  // Tali ID kantor + kartu.
  p.line(12, 25, 15, 29, '#f2c14e').line(20, 25, 17, 29, '#f2c14e');
  p.rect(15, 29, 3, 3, '#f4efe4').set(16, 30, '#2f6f9f');
  return p.outline(OUTLINE);
}

/** Pak Joko: teknisi senior Bengkel IT. Rambut beruban, kumis, kacamata di dahi, rompi kerja. */
function joko(): PixelCanvas {
  const p = new PixelCanvas(32, 32);
  const skin = '#bd875c';
  const grey = '#b8b8bc';
  shoulders(p, '#5e6b4a');
  // Kaus di balik rompi + kantong berisi obeng.
  p.rect(13, 25, 6, 7, '#d0644e');
  p.rect(20, 27, 4, 3, '#4a5639').line(21, 24, 21, 27, '#f2c14e').line(22, 25, 22, 27, '#c3cad6');
  neckAndHead(p, skin);
  // Rambut beruban di samping, atas agak botak.
  p.ellipse(16, 9.5, 8.4, 4.2, grey, {
    shade: '#8f8f96',
    clip: (x, y) => y <= 9 && (x < 12 || x > 19),
  });
  p.rect(8, 9, 2, 6, grey).rect(22, 9, 2, 6, grey);
  // Kacamata bertengger di dahi.
  p.line(11, 10, 20, 10, '#1b1b22').rect(11, 9, 3, 2, '#8fd0fa').rect(17, 9, 3, 2, '#8fd0fa');
  faceFeatures(p, skin, grey, 2);
  // Kumis.
  p.rect(13, 18, 6, 2, '#6e6e74').set(12, 19, '#6e6e74').set(19, 19, '#6e6e74');
  return p.outline(OUTLINE);
}

function kelabu(): PixelCanvas {
  const p = new PixelCanvas(32, 32);
  const hood = '#5b6070';
  p.ellipse(16, 33.5, 13.5, 8.5, '#4a4f5c', shaded('#4a4f5c'));
  p.ellipse(16, 15, 11, 12, hood, shaded(hood));
  p.ellipse(16, 16.5, 6.8, 7.4, '#1e2129');
  p.rect(12, 15, 3, 1, '#8fd0fa').rect(18, 15, 3, 1, '#8fd0fa');
  p.set(12, 16, '#3c6e8f').set(20, 16, '#3c6e8f');
  p.line(14, 20, 18, 19, '#3a3e4a');
  p.line(13, 25, 13, 30, '#c9ccd6').line(19, 25, 19, 30, '#c9ccd6');
  p.outline(OUTLINE);
  // Sedikit "glitch" di tepi: penanda tokoh digital, bukan menakutkan.
  for (const [x, y, c] of [
    [27, 9, '#8fd0fa'],
    [28, 9, '#8fd0fa'],
    [3, 19, '#f07a6a'],
    [4, 19, '#f07a6a'],
    [29, 22, '#74cf92'],
  ] as const)
    p.set(x, y, c);
  return p;
}

function system(): PixelCanvas {
  const p = new PixelCanvas(32, 32);
  p.line(16, 1, 16, 4, '#9aa3b8');
  p.ellipse(16, 1.5, 1.6, 1.6, '#f07a6a');
  p.rect(4, 5, 24, 18, '#5d6b82', { shade: '#48536a', light: '#76839c' });
  p.rect(6, 7, 20, 14, '#0f1a14');
  for (let y = 8; y < 21; y += 2) p.line(6, y, 25, y, '#0c140f');
  p.rect(10, 10, 3, 3, '#74cf92').rect(19, 10, 3, 3, '#74cf92');
  p.set(10, 10, '#b8f0c8').set(19, 10, '#b8f0c8');
  p.rect(12, 16, 8, 1, '#74cf92').set(11, 15, '#74cf92').set(20, 15, '#74cf92');
  p.set(24, 21, '#f2c14e');
  p.rect(14, 23, 4, 3, '#48536a').rect(9, 26, 14, 3, '#3d4658', { light: '#56617a' });
  return p.outline(OUTLINE);
}

const cache = new Map<string, { fill: string; d: string }[]>();

/** Path SVG potret (di-cache: wajah yang sama tidak digambar ulang). */
export function portraitPaths(kind: PortraitKind, seed = ''): { fill: string; d: string }[] {
  const key = `${kind}:${seed}`;
  let paths = cache.get(key);
  if (!paths) {
    const canvas =
      kind === 'system'
        ? system()
        : kind === 'joko'
          ? joko()
          : kind === 'rani'
            ? rani()
            : kind === 'kelabu'
              ? kelabu()
              : person(seed);
    paths = canvas.toPaths();
    cache.set(key, paths);
  }
  return paths;
}
