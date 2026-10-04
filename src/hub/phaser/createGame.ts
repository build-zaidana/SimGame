/**
 * Kantor top-down dengan Phaser 4 (PRD C1, ADR 024). Hanya file di src/hub/phaser/ yang boleh
 * mengimpor Phaser, dan modul ini selalu dimuat dinamis (tidak masuk bundle awal).
 * Logika gerak & interaksi ada di ../officeMap.ts (murni, teruji); di sini hanya gambar + input.
 */
import { AUTO, Game, Scale, Scene, type Types } from 'phaser';
import type { PixelCanvas } from '../../app/ui/pixel/canvas.ts';
import {
  drawCharacter,
  drawOffice,
  JOKO_LOOK,
  PLAYER_LOOK,
  RANI_LOOK,
  type Facing,
} from '../officeArt.ts';
import {
  HOTSPOTS,
  JOKO_TILE,
  PLAYER_SIZE,
  RANI_TILE,
  SPAWN,
  TILE,
  WORLD_H,
  WORLD_W,
  hotspotAt,
  moveToward,
  step,
  type Vec,
} from '../officeMap.ts';
import type { HubHandle, HubOptions } from '../hubTypes.ts';

const SPEED = 64; // px dunia per detik
const STEP_MS = 160; // ganti langkah kaki
const FACINGS: Facing[] = ['down', 'up', 'left', 'right'];

/** Menyalin kanvas pixel ke <canvas> lalu mendaftarkannya sebagai tekstur Phaser. */
function addPixelTexture(scene: Scene, key: string, art: PixelCanvas) {
  const el = document.createElement('canvas');
  el.width = art.w;
  el.height = art.h;
  const ctx = el.getContext('2d');
  if (!ctx) return;
  for (const { fill, d } of art.toPaths()) {
    ctx.fillStyle = fill;
    for (const m of d.matchAll(/M(\d+) (\d+)h(\d+)/g))
      ctx.fillRect(Number(m[1]), Number(m[2]), Number(m[3]), 1);
  }
  scene.textures.addCanvas(key, el);
}

/** Objek padat yang bisa diketuk untuk berjalan ke zona interaksinya (tile). */
const TAP_TARGETS: { id: string; x: number; y: number; w: number; h: number }[] = HOTSPOTS.map(
  (h) => ({ id: h.id, x: h.zone.x, y: Math.max(0, h.zone.y - 3), w: h.zone.w, h: h.zone.h + 3 }),
);

class OfficeScene extends Scene {
  private opts!: HubOptions;
  private pos: Vec = SPAWN;
  private target: Vec | null = null;
  private pending: string | null = null;
  private near: string | null = null;
  private facing: Facing = 'down';
  private frame: 0 | 1 = 0;
  private walkedMs = 0;
  private player!: Phaser.GameObjects.Image;
  private keys!: Record<
    'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd',
    Phaser.Input.Keyboard.Key
  >;

  constructor() {
    super('office');
  }

  init(data: HubOptions) {
    this.opts = data;
  }

  create() {
    addPixelTexture(this, 'office', drawOffice(this.opts.activeModes));
    for (const f of FACINGS)
      for (const fr of [0, 1] as const) {
        addPixelTexture(this, `player-${f}-${fr}`, drawCharacter(PLAYER_LOOK, f, fr));
      }
    addPixelTexture(this, 'rani', drawCharacter(RANI_LOOK, 'down', 0));
    addPixelTexture(this, 'joko', drawCharacter(JOKO_LOOK, 'down', 0));

    this.add.image(0, 0, 'office').setOrigin(0);
    this.add.image(RANI_TILE.x * TILE - 4, (RANI_TILE.y + 1) * TILE - 8, 'rani').setOrigin(0);
    this.add.image(JOKO_TILE.x * TILE - 4, (JOKO_TILE.y + 1) * TILE - 8, 'joko').setOrigin(0);
    this.player = this.add.image(0, 0, 'player-down-0').setOrigin(0);
    this.placePlayer();

    const kb = this.input.keyboard;
    if (kb) {
      const cursors = kb.createCursorKeys();
      const wasd = kb.addKeys('W,A,S,D') as Record<
        'W' | 'A' | 'S' | 'D',
        Phaser.Input.Keyboard.Key
      >;
      this.keys = {
        up: cursors.up,
        down: cursors.down,
        left: cursors.left,
        right: cursors.right,
        w: wasd.W,
        a: wasd.A,
        s: wasd.S,
        d: wasd.D,
      };
      for (const key of ['E', 'ENTER', 'SPACE']) kb.on(`keydown-${key}`, () => this.interact());
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const tx = pointer.worldX / TILE;
      const ty = pointer.worldY / TILE;
      const hit = TAP_TARGETS.find(
        (t) => tx >= t.x && tx < t.x + t.w && ty >= t.y && ty < t.y + t.h,
      );
      const zone = hit ? HOTSPOTS.find((h) => h.id === hit.id)?.zone : undefined;
      if (zone) {
        this.target = {
          x: (zone.x + zone.w / 2) * TILE - PLAYER_SIZE / 2,
          y: (zone.y + 1) * TILE,
        };
        this.pending = hit?.id ?? null;
      } else {
        this.target = { x: pointer.worldX - PLAYER_SIZE / 2, y: pointer.worldY - PLAYER_SIZE / 2 };
        this.pending = null;
      }
    });
  }

  interact() {
    const here = hotspotAt(this.pos);
    if (here) this.opts.callbacks.onInteract(here.id);
  }

  private placePlayer() {
    this.player.setPosition(Math.round(this.pos.x - 4), Math.round(this.pos.y - 8));
    this.player.setTexture(`player-${this.facing}-${this.frame}`);
  }

  update(_time: number, delta: number) {
    const k = this.keys;
    const dir = {
      x: (k?.right.isDown || k?.d.isDown ? 1 : 0) - (k?.left.isDown || k?.a.isDown ? 1 : 0),
      y: (k?.down.isDown || k?.s.isDown ? 1 : 0) - (k?.up.isDown || k?.w.isDown ? 1 : 0),
    };
    const before = this.pos;
    if (dir.x !== 0 || dir.y !== 0) {
      this.target = null;
      this.pending = null;
      this.pos = step(this.pos, dir, SPEED, delta);
    } else if (this.target) {
      const r = moveToward(this.pos, this.target, SPEED, delta);
      this.pos = r.pos;
      if (r.arrived) {
        this.target = null;
        if (this.pending && hotspotAt(this.pos)?.id === this.pending)
          this.opts.callbacks.onInteract(this.pending);
        this.pending = null;
      }
    }

    const dx = this.pos.x - before.x;
    const dy = this.pos.y - before.y;
    if (dx !== 0 || dy !== 0) {
      this.facing =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      this.walkedMs += delta;
      if (this.walkedMs >= STEP_MS) {
        this.walkedMs = 0;
        this.frame = this.frame === 0 ? 1 : 0;
      }
    } else {
      this.frame = 0;
    }
    this.placePlayer();

    const near = hotspotAt(this.pos)?.id ?? null;
    if (near !== this.near) {
      this.near = near;
      this.opts.callbacks.onNear(near);
    }
  }
}

export function createGame(parent: HTMLElement, opts: HubOptions): HubHandle {
  const config: Types.Core.GameConfig = {
    type: AUTO,
    parent,
    width: WORLD_W,
    height: WORLD_H,
    pixelArt: true,
    backgroundColor: '#161a24',
    scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_HORIZONTALLY },
    // Keyboard hanya saat kanvas difokus, agar panah/spasi tidak "dicuri" dari halaman.
    input: { keyboard: { target: parent }, gamepad: false },
    autoFocus: false,
    disableContextMenu: true,
    audio: { noAudio: true },
    banner: false,
  };
  const game = new Game(config);
  game.scene.add('office', OfficeScene, true, opts);
  return {
    interact: () => (game.scene.getScene('office') as OfficeScene | null)?.interact(),
    destroy: () => game.destroy(true),
  };
}
