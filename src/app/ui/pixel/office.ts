import { PixelCanvas } from './canvas.ts';
import { tint } from './portraits.ts';

/** Ilustrasi kantor PT Nusa Digital, 128×72 pixel. Semua digambar dari kode. */
export const OFFICE_W = 128;
export const OFFICE_H = 72;
export const DESK_X = [10, 40, 70, 100] as const;
export const DESK_W = 22;
/** Baris atas area meja yang bisa diklik (monitor) dan tingginya. */
export const DESK_TOP = 28;
export const DESK_HEIGHT = 38;

const C = {
  wall: '#2d3549',
  wallPanel: '#29304a',
  trim: '#3a4258',
  base: '#232a3a',
  floor: '#3b3328',
  plank: '#45392c',
  seam: '#2f281f',
  frame: '#161a24',
  wood: '#8a6a45',
  monitor: '#0b0d13',
  screenOff: '#2b3346',
  green: '#74cf92',
  greenDim: '#3f7a55',
  chair: '#4b556e',
  accent: '#f2c14e',
  paper: '#f4efe4',
  plant: '#4f9e64',
  pot: '#b0603e',
  danger: '#f07a6a',
};

function room(p: PixelCanvas) {
  p.rect(0, 0, OFFICE_W, 42, C.wall);
  for (let x = 6; x < OFFICE_W; x += 16) p.rect(x, 0, 1, 37, C.wallPanel);
  p.rect(0, 36, OFFICE_W, 1, C.trim).rect(0, 37, OFFICE_W, 5, C.base);
  p.rect(0, 42, OFFICE_W, 30, C.floor);
  for (let y = 42, row = 0; y < OFFICE_H; y += 5, row++) {
    p.rect(0, y, OFFICE_W, 1, C.seam);
    p.rect(0, y + 1, OFFICE_W, 1, C.plank);
    for (let x = (row % 2) * 13; x < OFFICE_W; x += 26) p.rect(x, y + 1, 1, 4, C.seam);
  }
}

function windowView(p: PixelCanvas) {
  const [x, y, w, h] = [12, 4, 26, 22];
  p.rect(x - 1, y - 1, w + 2, h + 2, C.frame);
  for (let j = 0; j < h; j++)
    p.rect(x, y + j, w, 1, j < 9 ? '#7cc4f2' : j < 15 ? '#97d2f6' : '#b3e0f9');
  p.ellipse(x + 7, y + 5, 4, 1.6, '#e9f5fc').ellipse(x + 10, y + 4, 3, 1.6, '#e9f5fc');
  p.ellipse(x + 20, y + 8, 3.5, 1.3, '#d7edf9');
  const buildings: [number, number, number, string][] = [
    [0, 10, 6, '#3a4a6a'],
    [6, 14, 5, '#46597d'],
    [11, 7, 6, '#3a4a6a'],
    [17, 12, 4, '#52668c'],
    [21, 9, 5, '#3a4a6a'],
  ];
  for (const [bx, top, bw, c] of buildings) {
    p.rect(x + bx, y + top, bw, h - top, c, { light: tint(c, 1.15) });
    for (let wy = y + top + 2; wy < y + h - 1; wy += 3)
      for (let wx = x + bx + 1; wx < x + bx + bw - 1; wx += 2)
        if ((wx * 7 + wy * 3) % 5 !== 0) p.set(wx, wy, '#f2d78a');
  }
  p.rect(x + 12, y, 1, h, C.frame).rect(x, y + 10, w, 1, C.frame);
  p.rect(x - 2, y + h + 1, w + 4, 2, '#5e4630', { light: '#7a5d40' });
}

/** Huruf 3×5 untuk papan "SOC". */
const GLYPH: Record<string, string[]> = {
  S: ['###', '#..', '###', '..#', '###'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  C: ['###', '#..', '#..', '#..', '###'],
};

function socBoard(p: PixelCanvas) {
  const [x, y, w, h] = [46, 5, 34, 19];
  p.rect(x - 1, y - 1, w + 2, h + 2, C.frame);
  p.rect(x, y, w, h, '#0f1a14');
  [...'SOC'].forEach((ch, i) =>
    GLYPH[ch]?.forEach((row, r) =>
      [...row].forEach((v, c) => v === '#' && p.set(x + 3 + i * 4 + c, y + 3 + r, C.green)),
    ),
  );
  // Grafik lalu lintas jaringan + lampu status.
  const pts = [12, 10, 11, 7, 9, 5, 8, 6, 4, 7, 6, 9, 8];
  pts
    .slice(1)
    .forEach((v, i) =>
      p.line(x + 3 + i * 2, y + (pts[i] ?? 0) + 3, x + 5 + i * 2, y + v + 3, C.green),
    );
  p.rect(x + 18, y + 3, 13, 1, C.greenDim).rect(x + 18, y + 5, 9, 1, C.greenDim);
  p.set(x + 30, y + 15, C.green)
    .set(x + 28, y + 15, C.accent)
    .set(x + 26, y + 15, C.danger);
}

function clock(p: PixelCanvas) {
  p.ellipse(92, 12, 6.5, 6.5, C.frame);
  p.ellipse(92, 12, 5.5, 5.5, C.paper, { shade: '#d9d1c0' });
  p.line(92, 12, 92, 8, C.frame).line(92, 12, 95, 12, C.frame);
  p.set(92, 7, C.danger);
}

function poster(p: PixelCanvas) {
  const [x, y] = [106, 5];
  p.rect(x, y, 16, 22, '#c95d7a', { shade: '#a84a65', light: '#d97a93' });
  // Gembok: lambang keamanan.
  p.rect(x + 5, y + 4, 6, 1, C.paper)
    .rect(x + 4, y + 5, 1, 4, C.paper)
    .rect(x + 11, y + 5, 1, 4, C.paper);
  p.rect(x + 3, y + 9, 10, 8, C.accent, { shade: '#c99a30' });
  p.rect(x + 7, y + 11, 2, 3, C.frame);
  p.rect(x + 3, y + 19, 10, 1, C.paper);
}

function plant(p: PixelCanvas, x: number) {
  for (const [dx, dy, r] of [
    [3, 22, 3.5],
    [0, 26, 3],
    [6, 26, 3],
    [2, 30, 3],
    [5, 30, 2.8],
  ] as const)
    p.ellipse(x + dx, dy, r, r * 0.8, C.plant, { shade: '#3c7c4d', light: '#6cbb7f' });
  p.rect(x - 1, 32, 9, 9, C.pot, { shade: '#8c4b30', light: '#c97a55' });
  p.rect(x - 2, 32, 11, 2, '#c97a55');
}

function desk(p: PixelCanvas, x: number, active: boolean) {
  // Monitor.
  p.rect(x + 4, 29, 14, 11, C.monitor);
  p.rect(x + 5, 30, 12, 9, active ? '#0f1a14' : C.screenOff);
  if (active) {
    for (const [dy, len] of [
      [1, 8],
      [3, 6],
      [5, 9],
      [7, 4],
    ] as const)
      p.rect(x + 6, 30 + dy, len, 1, dy === 7 ? C.accent : C.green);
  } else {
    p.line(x + 6, 31, x + 8, 31, '#3a4258');
  }
  p.rect(x + 10, 40, 2, 4, C.monitor).rect(x + 8, 44, 6, 1, C.monitor);
  // Meja.
  p.rect(x, 45, DESK_W, 3, C.wood, { shade: '#6e5236', light: '#a3825a' });
  p.rect(x + 1, 48, DESK_W - 2, 1, '#5e4630');
  p.rect(x + 2, 49, 2, 13, '#5e4630').rect(x + DESK_W - 4, 49, 2, 13, '#5e4630');
  // Keyboard, mug, kertas.
  p.rect(x + 6, 44, 9, 1, '#9aa3b8');
  p.rect(x + 17, 42, 3, 3, active ? C.danger : '#9aa3b8').set(
    x + 20,
    43,
    active ? C.danger : '#9aa3b8',
  );
  p.rect(x + 1, 44, 4, 1, C.paper);
  if (active) p.rect(x + 3, 45, 16, 1, '#a3825a'); // pantulan cahaya layar
  // Kursi di depan meja.
  p.rect(x + 7, 51, 8, 6, C.chair, { shade: '#3c445a', light: '#5d6884' });
  p.rect(x + 6, 57, 10, 2, '#5d6884', { shade: '#3c445a' });
  p.rect(x + 10, 59, 2, 4, '#3c445a').rect(x + 7, 63, 8, 1, '#3c445a');
}

function rani(p: PixelCanvas, x: number) {
  const scarf = '#3f9a8a';
  p.rect(x + 1, 52, 3, 10, '#232a3a').rect(x + 5, 52, 3, 10, '#232a3a');
  p.rect(x, 62, 4, 2, C.frame).rect(x + 5, 62, 4, 2, C.frame);
  p.rect(x, 40, 9, 13, '#2f6f9f', { shade: '#255a82', light: '#3f83b5' });
  p.rect(x - 1, 41, 1, 9, '#2f6f9f').rect(x + 9, 41, 1, 9, '#255a82');
  p.set(x - 1, 50, '#dcab80').set(x + 9, 50, '#dcab80');
  p.ellipse(x + 4.5, 35, 5, 5.5, scarf, { shade: '#2f7a6d', light: '#52b3a1' });
  p.ellipse(x + 4.5, 35.5, 3, 3.6, '#dcab80');
  p.set(x + 3, 35, C.frame)
    .set(x + 6, 35, C.frame)
    .set(x + 4, 37, '#8a3b3b')
    .set(x + 5, 37, '#8a3b3b');
  p.rect(x + 4, 44, 2, 2, C.paper);
}

const cache = new Map<number, { fill: string; d: string }[]>();

/** Path SVG ilustrasi kantor; `activeDesk` = indeks meja yang menyala. */
export function officePaths(activeDesk: number): { fill: string; d: string }[] {
  let paths = cache.get(activeDesk);
  if (!paths) {
    const p = new PixelCanvas(OFFICE_W, OFFICE_H);
    room(p);
    windowView(p);
    socBoard(p);
    clock(p);
    poster(p);
    plant(p, 2);
    DESK_X.forEach((x, i) => desk(p, x, i === activeDesk));
    rani(p, 32);
    paths = p.toPaths();
    cache.set(activeDesk, paths);
  }
  return paths;
}
