import { describe, expect, it } from 'vitest';
import { PixelCanvas } from '../canvas.ts';
import { portraitPaths, tint } from '../portraits.ts';
import { officePaths } from '../office.ts';

describe('PixelCanvas', () => {
  it('merges horizontal runs into one path per colour', () => {
    const p = new PixelCanvas(4, 2).rect(0, 0, 3, 1, '#fff').set(3, 1, '#000');
    expect(p.toPaths()).toEqual([
      { fill: '#fff', d: 'M0 0h3v1h-3z' },
      { fill: '#000', d: 'M3 1h1v1h-1z' },
    ]);
  });

  it('ignores pixels outside the canvas', () => {
    const p = new PixelCanvas(2, 2).rect(-1, -1, 5, 5, '#fff');
    expect(p.toPaths()).toEqual([{ fill: '#fff', d: 'M0 0h2v1h-2zM0 1h2v1h-2z' }]);
  });

  it('outlines filled shapes on their empty neighbours only', () => {
    const p = new PixelCanvas(3, 3).set(1, 1, '#fff').outline('#000');
    expect(p.get(1, 1)).toBe('#fff');
    expect([p.get(1, 0), p.get(0, 1), p.get(2, 1), p.get(1, 2)]).toEqual(Array(4).fill('#000'));
    expect(p.get(0, 0)).toBeNull();
  });

  it('shades an ellipse darker toward the bottom-right', () => {
    const p = new PixelCanvas(10, 10).ellipse(5, 5, 4.5, 4.5, '#888', {
      shade: '#444',
      light: '#ccc',
    });
    expect(p.get(8, 7)).toBe('#444');
    expect(p.get(2, 2)).toBe('#ccc');
    expect(p.get(5, 5)).toBe('#888');
  });
});

describe('tint', () => {
  it('darkens and lightens hex colours', () => {
    expect(tint('#808080', 0.5)).toBe('#404040');
    expect(tint('#000000', 2)).toBe('#ffffff');
  });
});

describe('generated art', () => {
  it('portraits are deterministic per seed and differ between people', () => {
    expect(portraitPaths('person', 'Sari Lestari')).toEqual(
      portraitPaths('person', 'Sari Lestari'),
    );
    expect(portraitPaths('person', 'Sari Lestari')).not.toEqual(
      portraitPaths('person', 'Agus Salim'),
    );
  });
  it('stay within the 32×32 / 128×72 grids', () => {
    const maxX = (paths: { d: string }[]) =>
      Math.max(
        ...paths.flatMap(({ d }) =>
          [...d.matchAll(/M(\d+) \d+h(\d+)/g)].map((m) => +m[1]! + +m[2]!),
        ),
      );
    expect(maxX(portraitPaths('rani'))).toBeLessThanOrEqual(32);
    expect(maxX(officePaths(0))).toBeLessThanOrEqual(128);
  });
});
