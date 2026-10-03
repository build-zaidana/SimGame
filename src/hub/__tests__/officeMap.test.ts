import { describe, expect, it } from 'vitest';
import {
  HOTSPOTS,
  PLAYER_SIZE,
  SPAWN,
  TILE,
  WORLD_H,
  WORLD_W,
  hotspotAt,
  isBlocked,
  moveToward,
  step,
} from '../officeMap.ts';

describe('office map', () => {
  it('spawns the player on free floor inside the room', () => {
    expect(isBlocked(SPAWN.x, SPAWN.y)).toBe(false);
    expect(SPAWN.x).toBeGreaterThan(0);
    expect(SPAWN.y).toBeLessThan(WORLD_H);
  });

  it('blocks the outer walls', () => {
    expect(isBlocked(-1, 100)).toBe(true);
    expect(isBlocked(WORLD_W - PLAYER_SIZE + 1, 100)).toBe(true);
    expect(isBlocked(100, 0)).toBe(true);
    expect(isBlocked(100, WORLD_H)).toBe(true);
  });

  it('has a reachable interaction zone in front of every hotspot', () => {
    for (const h of HOTSPOTS) {
      const cx = (h.zone.x + h.zone.w / 2) * TILE - PLAYER_SIZE / 2;
      const cy = (h.zone.y + h.zone.h / 2) * TILE - PLAYER_SIZE / 2;
      expect(isBlocked(cx, cy), h.id).toBe(false);
      expect(hotspotAt({ x: cx, y: cy })?.id).toBe(h.id);
    }
  });

  it('includes the four desks, the mentor, the shop and the rulebook', () => {
    expect(HOTSPOTS.map((h) => h.id).sort()).toEqual(
      [
        'desk:data',
        'desk:dev',
        'desk:soc',
        'desk:support',
        'menu:badges',
        'menu:rulebook',
        'menu:shop',
        'npc:rani',
      ].sort(),
    );
  });
});

describe('step (keyboard movement)', () => {
  it('moves by speed × time on free floor', () => {
    expect(step(SPAWN, { x: 1, y: 0 }, 50, 100)).toEqual({ x: SPAWN.x + 5, y: SPAWN.y });
  });

  it('normalises diagonal movement', () => {
    const p = step(SPAWN, { x: 1, y: 1 }, 100, 100);
    expect(Math.hypot(p.x - SPAWN.x, p.y - SPAWN.y)).toBeCloseTo(10, 5);
  });

  it('slides along a wall instead of stopping (axis-separated collision)', () => {
    const nearTop = { x: 100, y: 4 * TILE + 0.5 };
    const p = step(nearTop, { x: 1, y: -1 }, 100, 100);
    expect(p.y).toBe(nearTop.y);
    expect(p.x).toBeGreaterThan(nearTop.x);
  });

  it('never ends inside a wall even with a huge time step', () => {
    let p = SPAWN;
    for (let i = 0; i < 50; i++) p = step(p, { x: -1, y: 0 }, 500, 1000);
    expect(isBlocked(p.x, p.y)).toBe(false);
  });
});

describe('moveToward (tap to walk)', () => {
  it('walks toward the target and stops on arrival', () => {
    const target = { x: SPAWN.x + 4, y: SPAWN.y };
    const a = moveToward(SPAWN, target, 40, 50);
    expect(a.arrived).toBe(false);
    const b = moveToward(a.pos, target, 40, 1000);
    expect(b.arrived).toBe(true);
    expect(b.pos).toEqual(target);
  });

  it('gives up when blocked so the player does not jitter against a wall', () => {
    const r = moveToward({ x: 100, y: 4 * TILE }, { x: 100, y: -50 }, 40, 100);
    expect(r.arrived).toBe(true);
  });
});
