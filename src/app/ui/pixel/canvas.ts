/**
 * Kanvas pixel kecil untuk menggambar sprite dari kode (potret, ilustrasi kantor).
 * Hasilnya tetap pixel art (crisp), tapi resolusinya cukup tinggi untuk bentuk bulat,
 * bayangan, dan outline. Dirender ke SVG sebagai satu <path> per warna.
 */
export type Color = string;

export interface ShadeOpts {
  /** Warna bagian yang jauh dari cahaya (cahaya dari kiri atas). */
  shade?: Color;
  /** Warna sorotan kecil di kiri atas. */
  light?: Color;
}

export class PixelCanvas {
  readonly w: number;
  readonly h: number;
  private px: (Color | null)[];

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Array<Color | null>(w * h).fill(null);
  }

  get(x: number, y: number): Color | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.px[y * this.w + x] ?? null;
  }

  set(x: number, y: number, c: Color | null): this {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return this;
    this.px[yi * this.w + xi] = c;
    return this;
  }

  rect(x: number, y: number, w: number, h: number, c: Color, opts: ShadeOpts = {}): this {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const shaded = opts.shade && (i >= w - Math.max(1, Math.round(w * 0.2)) || j === h - 1);
        const lit = opts.light && (i === 0 || j === 0);
        this.set(x + i, y + j, shaded ? opts.shade! : lit ? opts.light! : c);
      }
    return this;
  }

  /** Elips terisi; dengan `shade`, sisi kanan-bawah lebih gelap. `clip` membatasi area. */
  ellipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    c: Color,
    opts: ShadeOpts & { clip?: (x: number, y: number) => boolean } = {},
  ): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        if (opts.clip && !opts.clip(x, y)) continue;
        const towardLight = -dx * 0.7 - dy * 0.7;
        const color =
          opts.light && towardLight > 0.55
            ? opts.light
            : opts.shade && towardLight < -0.35
              ? opts.shade
              : c;
        this.set(x, y, color);
      }
    return this;
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Color): this {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++)
      this.set(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, c);
    return this;
  }

  /** Garis tepi gelap di sekeliling semua pixel terisi (gaya sprite). */
  outline(c: Color): this {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1))
          add.push([x, y]);
      }
    for (const [x, y] of add) this.set(x, y, c);
    return this;
  }

  /** Satu path SVG per warna; pixel bersebelahan dalam satu baris digabung. */
  toPaths(): { fill: Color; d: string }[] {
    const byColor = new Map<Color, string[]>();
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        const c = this.get(x, y);
        if (!c) {
          x++;
          continue;
        }
        let run = 1;
        while (this.get(x + run, y) === c) run++;
        const parts = byColor.get(c) ?? [];
        parts.push(`M${x} ${y}h${run}v1h-${run}z`);
        byColor.set(c, parts);
        x += run;
      }
    }
    return [...byColor].map(([fill, parts]) => ({ fill, d: parts.join('') }));
  }
}
