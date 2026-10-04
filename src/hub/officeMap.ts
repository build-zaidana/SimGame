/**
 * Peta kantor top-down (PRD C1, ADR 024): dinding, perabot padat, dan zona interaksi.
 * Logika murni (tanpa Phaser) supaya pergerakan & tabrakan bisa diuji.
 * Koordinat posisi = pojok kiri atas kotak kaki pemain, dalam pixel dunia.
 */
export const TILE = 8;
export const COLS = 40;
export const ROWS = 24;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;
/** Kotak tabrakan pemain (kaki), dalam pixel. */
export const PLAYER_SIZE = 8;

export interface Vec {
  x: number;
  y: number;
}
interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type HotspotKind = 'desk' | 'menu' | 'npc';
export interface Hotspot {
  /** 'desk:<modeId>', 'menu:<layar>', atau 'npc:<nama>'. */
  id: string;
  kind: HotspotKind;
  /** Area tempat pemain berdiri untuk berinteraksi (tile). */
  zone: TileRect;
}

/** Perabot & dinding yang tidak bisa dilewati (tile). */
export const DESKS: { modeId: string; x: number }[] = [
  { modeId: 'soc', x: 4 },
  { modeId: 'support', x: 13 },
  { modeId: 'dev', x: 22 },
  { modeId: 'data', x: 31 },
];
export const DESK_Y = 6;
export const DESK_W = 6;
export const DESK_H = 3;
export const RANI_TILE = { x: 11, y: 8 };
/** Pak Joko berdiri di antara meja Bengkel IT dan meja berikutnya. */
export const JOKO_TILE = { x: 19, y: 8 };
export const SHOP = { x: 3, y: 17, w: 8, h: 2 };
export const SHELF = { x: 33, y: 16, w: 5, h: 3 };
export const BADGE_BOARD = { x: 25, y: 1, w: 6, h: 2 };

const SOLIDS: TileRect[] = [
  { x: 0, y: 0, w: COLS, h: 4 },
  { x: 0, y: 0, w: 1, h: ROWS },
  { x: COLS - 1, y: 0, w: 1, h: ROWS },
  { x: 0, y: ROWS - 1, w: COLS, h: 1 },
  ...DESKS.map((d) => ({ x: d.x, y: DESK_Y, w: DESK_W, h: DESK_H })),
  { x: RANI_TILE.x, y: RANI_TILE.y + 1, w: 1, h: 1 },
  { x: JOKO_TILE.x, y: JOKO_TILE.y + 1, w: 1, h: 1 },
  SHOP,
  SHELF,
  { x: 1, y: 4, w: 2, h: 2 },
  { x: 37, y: 20, w: 2, h: 2 },
];

export const HOTSPOTS: Hotspot[] = [
  ...DESKS.map((d): Hotspot => ({
    id: `desk:${d.modeId}`,
    kind: 'desk',
    zone: { x: d.x, y: DESK_Y + DESK_H, w: DESK_W, h: 3 },
  })),
  { id: 'npc:rani', kind: 'npc', zone: { x: 10, y: 10, w: 3, h: 2 } },
  { id: 'npc:joko', kind: 'npc', zone: { x: 19, y: 10, w: 2, h: 2 } },
  { id: 'menu:shop', kind: 'menu', zone: { x: SHOP.x, y: SHOP.y + SHOP.h, w: SHOP.w, h: 3 } },
  {
    id: 'menu:rulebook',
    kind: 'menu',
    zone: { x: SHELF.x, y: SHELF.y + SHELF.h, w: SHELF.w, h: 3 },
  },
  { id: 'menu:badges', kind: 'menu', zone: { x: BADGE_BOARD.x, y: 4, w: BADGE_BOARD.w, h: 2 } },
];

export const SPAWN: Vec = { x: 20 * TILE, y: 15 * TILE };

const overlaps = (x: number, y: number, r: TileRect) =>
  x < (r.x + r.w) * TILE &&
  x + PLAYER_SIZE > r.x * TILE &&
  y < (r.y + r.h) * TILE &&
  y + PLAYER_SIZE > r.y * TILE;

/** true bila kotak kaki pemain di (x, y) menabrak dinding/perabot atau keluar dunia. */
export function isBlocked(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x + PLAYER_SIZE > WORLD_W || y + PLAYER_SIZE > WORLD_H) return true;
  return SOLIDS.some((r) => overlaps(x, y, r));
}

/** Hotspot yang zonanya memuat titik tengah pemain. */
export function hotspotAt(pos: Vec): Hotspot | null {
  const cx = pos.x + PLAYER_SIZE / 2;
  const cy = pos.y + PLAYER_SIZE / 2;
  return (
    HOTSPOTS.find(
      ({ zone: z }) =>
        cx >= z.x * TILE && cx < (z.x + z.w) * TILE && cy >= z.y * TILE && cy < (z.y + z.h) * TILE,
    ) ?? null
  );
}

/** Bergerak satu sumbu, ≤ 1 px per langkah, berhenti sebelum menabrak (tidak bisa menembus dinding). */
function moveAxis(pos: Vec, axis: 'x' | 'y', delta: number): Vec {
  let p = pos;
  let left = delta;
  while (Math.abs(left) > 1e-9) {
    const d = Math.sign(left) * Math.min(1, Math.abs(left));
    const next = { ...p, [axis]: p[axis] + d };
    if (isBlocked(next.x, next.y)) break;
    p = next;
    left -= d;
  }
  return p;
}

/** Gerak keyboard: arah dinormalkan, kecepatan px/detik, tabrakan per sumbu (meluncur di dinding). */
export function step(pos: Vec, dir: Vec, speed: number, dtMs: number): Vec {
  const len = Math.hypot(dir.x, dir.y);
  if (len === 0) return pos;
  const dist = (speed * dtMs) / 1000;
  const afterX = moveAxis(pos, 'x', (dir.x / len) * dist);
  return moveAxis(afterX, 'y', (dir.y / len) * dist);
}

/** Gerak ketuk-untuk-berjalan: menuju target; `arrived` juga true bila terhalang (berhenti). */
export function moveToward(
  pos: Vec,
  target: Vec,
  speed: number,
  dtMs: number,
): { pos: Vec; arrived: boolean } {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const dist = Math.hypot(dx, dy);
  const reach = (speed * dtMs) / 1000;
  if (dist <= reach && !isBlocked(target.x, target.y)) return { pos: target, arrived: true };
  const next = step(pos, { x: dx, y: dy }, speed, dtMs);
  const stuck = next.x === pos.x && next.y === pos.y;
  return { pos: next, arrived: stuck };
}
