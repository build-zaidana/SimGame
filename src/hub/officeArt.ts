import { PixelCanvas } from '../app/ui/pixel/canvas.ts';
import { tint } from '../app/ui/pixel/portraits.ts';
import {
  BADGE_BOARD,
  DESKS,
  DESK_H,
  DESK_W,
  DESK_Y,
  SHELF,
  SHOP,
  TILE,
  WORLD_H,
  WORLD_W,
} from './officeMap.ts';

/** Seni kantor top-down (ADR 024): latar 320×192 dan karakter 16×16, digambar dari kode. */
const C = {
  wall: '#2d3549',
  panel: '#29304a',
  trim: '#3a4258',
  base: '#1d2230',
  floorA: '#3b3328',
  floorB: '#41382c',
  seam: '#2f281f',
  frame: '#161a24',
  wood: '#8a6a45',
  woodDark: '#5e4630',
  monitor: '#0b0d13',
  green: '#74cf92',
  greenDim: '#3f7a55',
  chair: '#4b556e',
  paper: '#f4efe4',
  accent: '#f2c14e',
  danger: '#f07a6a',
  plant: '#4f9e64',
  pot: '#b0603e',
  rug: '#3f5a8a',
};
const T = TILE;
const OUTLINE = '#14101c';

function room(p: PixelCanvas) {
  p.rect(0, 0, WORLD_W, 4 * T, C.wall);
  for (let x = 4; x < WORLD_W; x += 16) p.rect(x, 0, 1, 4 * T - 3, C.panel);
  p.rect(0, 4 * T - 3, WORLD_W, 1, C.trim).rect(0, 4 * T - 2, WORLD_W, 2, C.base);
  for (let y = 4 * T, row = 0; y < WORLD_H; y += 6, row++) {
    p.rect(0, y, WORLD_W, 6, row % 2 ? C.floorA : C.floorB);
    p.rect(0, y, WORLD_W, 1, C.seam);
    for (let x = (row % 3) * 17; x < WORLD_W; x += 51) p.rect(x, y, 1, 6, C.seam);
  }
  // Bayangan dinding di lantai.
  p.rect(0, 4 * T, WORLD_W, 2, '#2a241c');
  // Dinding samping & bawah.
  p.rect(0, 4 * T, 4, WORLD_H, C.base).rect(WORLD_W - 4, 4 * T, 4, WORLD_H, C.base);
  p.rect(0, WORLD_H - 6, WORLD_W, 6, C.base);
  // Pintu & keset di bawah tengah.
  p.rect(18 * T, WORLD_H - 6, 4 * T, 6, '#5e4630').rect(
    18 * T + 2,
    WORLD_H - 14,
    4 * T - 4,
    7,
    '#7a3f3f',
  );
  // Karpet di tengah.
  p.rect(15 * T, 13 * T, 10 * T, 6 * T, C.rug, {
    shade: tint(C.rug, 0.8),
    light: tint(C.rug, 1.15),
  });
  p.rect(15 * T + 3, 13 * T + 3, 10 * T - 6, 6 * T - 6, tint(C.rug, 0.9));
}

function wallDecor(p: PixelCanvas) {
  // Jendela.
  const wx = 3 * T;
  p.rect(wx - 1, 3, 8 * T + 2, 22, C.frame);
  for (let j = 0; j < 20; j++) p.rect(wx, 4 + j, 8 * T, 1, j < 9 ? '#7cc4f2' : '#a6dbf8');
  for (const [bx, h, c] of [
    [0, 9, '#3a4a6a'],
    [9, 13, '#46597d'],
    [20, 7, '#3a4a6a'],
    [30, 11, '#52668c'],
    [44, 8, '#3a4a6a'],
    [54, 12, '#46597d'],
  ] as const) {
    p.rect(wx + bx, 24 - h, 10, h, c);
    for (let y = 24 - h + 2; y < 23; y += 3)
      p.set(wx + bx + 3, y, '#f2d78a').set(wx + bx + 6, y, '#f2d78a');
  }
  p.rect(wx + 4 * T - 1, 3, 2, 22, C.frame);
  // Papan SOC.
  const sx = 14 * T;
  p.rect(sx - 1, 3, 8 * T + 2, 22, C.frame).rect(sx, 4, 8 * T, 20, '#0f1a14');
  const pts = [
    12, 9, 10, 6, 8, 4, 7, 5, 3, 6, 5, 8, 7, 4, 6, 9, 5, 7, 4, 6, 8, 5, 7, 6, 9, 8, 6, 7, 5, 4,
  ];
  pts
    .slice(1)
    .forEach((v, i) => p.line(sx + 3 + i * 2, 6 + (pts[i] ?? 0), sx + 5 + i * 2, 6 + v, C.green));
  p.set(sx + 60, 21, C.green)
    .set(sx + 57, 21, C.accent)
    .set(sx + 54, 21, C.danger);
  // Jam.
  p.ellipse(23 * T, 13, 6, 6, C.frame).ellipse(23 * T, 13, 5, 5, C.paper, { shade: '#d9d1c0' });
  p.line(23 * T, 13, 23 * T, 9, C.frame).line(23 * T, 13, 23 * T + 3, 13, C.frame);
  // Papan lencana (gabus + medali).
  const b = BADGE_BOARD;
  p.rect(b.x * T - 1, b.y * T - 1, b.w * T + 2, b.h * T + 2, C.woodDark);
  p.rect(b.x * T, b.y * T, b.w * T, b.h * T, '#b0805a', { shade: '#966a48' });
  for (let i = 0; i < 5; i++) {
    const cx = b.x * T + 6 + i * 9;
    p.line(cx - 1, b.y * T + 2, cx, b.y * T + 6, i % 2 ? '#4e7fd0' : '#d0644e');
    p.ellipse(cx, b.y * T + 9, 3, 3, ['#c9814a', '#c3cad6', '#f2c14e'][i % 3]!, {
      shade: '#7a5a3a',
    });
  }
}

function desk(p: PixelCanvas, x: number, active: boolean) {
  const X = x * T;
  const Y = DESK_Y * T;
  const W = DESK_W * T;
  const H = DESK_H * T;
  p.rect(X + 2, Y + H, W - 2, 2, '#2a241c'); // bayangan
  p.rect(X, Y, W, H - 2, C.wood, { shade: '#6e5236', light: '#a3825a' });
  p.rect(X, Y + H - 2, W, 2, C.woodDark);
  // Monitor (dilihat dari atas-depan) + keyboard + mug + kertas.
  p.rect(X + 14, Y + 1, 20, 12, C.monitor);
  p.rect(X + 15, Y + 2, 18, 9, active ? '#0f1a14' : '#2b3346');
  if (active) {
    p.rect(X + 16, Y + 3, 10, 1, C.green).rect(X + 16, Y + 5, 13, 1, C.green);
    p.rect(X + 16, Y + 7, 7, 1, C.green).rect(X + 16, Y + 9, 5, 1, C.accent);
  }
  p.rect(X + 22, Y + 13, 4, 2, C.monitor);
  p.rect(X + 15, Y + 16, 18, 4, '#9aa3b8', { shade: '#7c8499' });
  p.ellipse(X + 40, Y + 9, 3, 3, active ? C.danger : '#9aa3b8', { shade: '#555' });
  p.rect(X + 3, Y + 4, 8, 10, C.paper, { shade: '#d9d1c0' });
  if (!active) {
    // Gembok: meja terkunci ("Segera hadir").
    p.rect(X + 4, Y + 14, 6, 5, C.accent, { shade: '#c99a30' });
    p.rect(X + 5, Y + 11, 1, 3, '#c3cad6')
      .rect(X + 8, Y + 11, 1, 3, '#c3cad6')
      .rect(X + 5, Y + 11, 4, 1, '#c3cad6');
  }
  // Kursi di depan meja.
  p.ellipse(X + W / 2, Y + H + 9, 6, 5, C.chair, { shade: '#3c445a', light: '#5d6884' });
  p.rect(X + W / 2 - 6, Y + H + 2, 12, 3, '#3c445a');
}

function shop(p: PixelCanvas) {
  const X = SHOP.x * T;
  const Y = SHOP.y * T;
  p.rect(X + 2, Y + SHOP.h * T, SHOP.w * T - 2, 2, '#2a241c');
  p.rect(X, Y, SHOP.w * T, SHOP.h * T, '#6e5236', { light: '#8a6a45' });
  p.rect(X, Y, SHOP.w * T, 4, '#a3825a');
  // Alat-alat di meja toko: kaca pembesar, kalender, tabung, corong.
  p.ellipse(X + 9, Y + 9, 4, 4, '#c3cad6').ellipse(X + 9, Y + 9, 2.5, 2.5, '#8fd0fa');
  p.line(X + 12, Y + 12, X + 15, Y + 14, '#5e4630');
  p.rect(X + 22, Y + 5, 9, 8, C.paper).rect(X + 22, Y + 5, 9, 2, C.danger);
  p.rect(X + 38, Y + 4, 5, 10, '#74cf92', { shade: '#4f9e64' }).rect(
    X + 37,
    Y + 3,
    7,
    2,
    '#c3cad6',
  );
  p.line(X + 50, Y + 5, X + 58, Y + 5, C.accent).line(X + 51, Y + 6, X + 57, Y + 6, C.accent);
  p.line(X + 53, Y + 7, X + 55, Y + 7, C.accent).rect(X + 54, Y + 8, 1, 5, C.accent);
}

function shelf(p: PixelCanvas) {
  const X = SHELF.x * T;
  const Y = SHELF.y * T;
  p.rect(X, Y, SHELF.w * T, SHELF.h * T, C.woodDark, { light: '#7a5d40' });
  const spines = ['#d0644e', '#4e7fd0', '#f2c14e', '#4ea889', '#8e63c4', '#c3cad6'];
  for (let row = 0; row < 3; row++) {
    const y = Y + 2 + row * 7;
    p.rect(X + 2, y + 5, SHELF.w * T - 4, 1, '#3d2e1f');
    for (let i = 0, x = X + 3; x < X + SHELF.w * T - 4; i++, x += 3)
      p.rect(
        x,
        y + (i % 3 === 0 ? 1 : 0),
        2,
        5 - (i % 3 === 0 ? 1 : 0),
        spines[(i + row * 2) % spines.length]!,
      );
  }
}

function plant(p: PixelCanvas, x: number, y: number) {
  for (const [dx, dy, r] of [
    [3, 2, 4],
    [0, 5, 3.4],
    [7, 5, 3.4],
    [3, 7, 3.5],
  ] as const)
    p.ellipse(x + dx + 2, y + dy, r, r * 0.85, C.plant, { shade: '#3c7c4d', light: '#6cbb7f' });
  p.rect(x, y + 9, 10, 7, C.pot, { shade: '#8c4b30', light: '#c97a55' });
}

/** Latar kantor (tanpa karakter). */
export function drawOffice(activeModes: readonly string[]): PixelCanvas {
  const p = new PixelCanvas(WORLD_W, WORLD_H);
  room(p);
  wallDecor(p);
  for (const d of DESKS) desk(p, d.x, activeModes.includes(d.modeId));
  shop(p);
  shelf(p);
  plant(p, 1 * T, 4 * T - 4);
  plant(p, 37 * T, 20 * T - 2);
  return p;
}

export type Facing = 'down' | 'up' | 'left' | 'right';
export interface CharacterLook {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  /** Warna hijab; tanpa ini rambut biasa. */
  hijab?: string;
}

export const PLAYER_LOOK: CharacterLook = {
  skin: '#d9a77c',
  hair: '#2a1d16',
  shirt: '#3f8fa8',
  pants: '#232a3a',
};
export const RANI_LOOK: CharacterLook = {
  skin: '#dcab80',
  hair: '#2a1d16',
  shirt: '#2f6f9f',
  pants: '#232a3a',
  hijab: '#3f9a8a',
};

/** Pak Joko: rambut beruban, rompi kerja hijau zaitun. */
export const JOKO_LOOK: CharacterLook = {
  skin: '#bd875c',
  hair: '#b8b8bc',
  shirt: '#5e6b4a',
  pants: '#3a3226',
};

/** Kak Dimas: rambut hitam, hoodie biru tua. */
export const DIMAS_LOOK: CharacterLook = {
  skin: '#dcab80',
  hair: '#1b1b22',
  shirt: '#2d3a4a',
  pants: '#3a3226',
};

/** Karakter 16×16 dilihat dari atas-depan; `frame` 0/1 = langkah kaki. */
export function drawCharacter(look: CharacterLook, facing: Facing, frame: 0 | 1): PixelCanvas {
  const p = new PixelCanvas(16, 16);
  const step = frame === 1;
  // Kaki.
  const legL = step && facing !== 'up' ? 1 : 0;
  const legR = step && facing === 'up' ? 1 : 0;
  if (facing === 'left' || facing === 'right') {
    p.rect(6, 12, 2, 3 - (step ? 1 : 0), look.pants).rect(8, 12, 2, 3 - (step ? 0 : 1), look.pants);
  } else {
    p.rect(5, 12, 2, 3 - legL, look.pants).rect(9, 12, 2, 3 - legR, look.pants);
  }
  p.rect(5, 14 - legL, 2, 1, OUTLINE).rect(9, 14 - legR, 2, 1, OUTLINE);
  // Badan.
  p.rect(4, 8, 8, 5, look.shirt, { shade: tint(look.shirt, 0.78), light: tint(look.shirt, 1.15) });
  if (facing === 'down') p.rect(4, 8, 1, 4, look.skin).rect(11, 8, 1, 4, tint(look.skin, 0.85));
  // Kepala.
  if (look.hijab) {
    p.ellipse(8, 5, 4.6, 4.8, look.hijab, {
      shade: tint(look.hijab, 0.78),
      light: tint(look.hijab, 1.15),
    });
    p.rect(4, 8, 8, 2, look.hijab);
    if (facing !== 'up') {
      const fx = facing === 'left' ? 5 : facing === 'right' ? 7 : 6;
      p.rect(fx, 3, 4, 5, look.skin);
    }
  } else {
    p.ellipse(8, 5, 4.2, 4.4, look.skin, { shade: tint(look.skin, 0.86) });
    const cap = facing === 'up' ? 9 : 4;
    p.rect(4, 1, 8, cap > 4 ? 8 : 4, look.hair);
    if (facing === 'left') p.rect(9, 2, 3, 5, look.hair);
    if (facing === 'right') p.rect(4, 2, 3, 5, look.hair);
  }
  // Wajah.
  const eye = '#1b1b22';
  if (facing === 'down') p.set(6, 5, eye).set(9, 5, eye);
  if (facing === 'left') p.set(5, 5, eye);
  if (facing === 'right') p.set(10, 5, eye);
  return p.outline(OUTLINE);
}
