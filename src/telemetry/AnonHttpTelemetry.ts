import type { Telemetry, TelemetryEvent } from './Telemetry.ts';

/**
 * Analitik anonim opsional (PRD S6, ADR 018). Hanya aktif bila build diberi endpoint DAN pemain
 * menyetujuinya di Pengaturan. Payload: ID instalasi acak + event belajar + waktu per menit.
 * Tanpa nama, tanpa isi save, tanpa data perangkat. Pengiriman (fetch) disuntikkan dari app/.
 */
export interface AnonHttpOptions {
  endpoint: string;
  /** ID instalasi bila pemain setuju; null = jangan kirim dan buang antrean. */
  identity: () => { installId: string } | null;
  /** Mengirim body JSON; true bila diterima server. */
  send: (endpoint: string, body: string) => Promise<boolean>;
  now?: () => string;
  batchSize?: number;
  maxQueue?: number;
}

export type AnonEvent = TelemetryEvent & { at: string };

/** Waktu dipotong ke menit: cukup untuk analisis belajar, tidak lebih. */
const toMinute = (iso: string) => `${iso.slice(0, 16)}Z`;

export class AnonHttpTelemetry implements Telemetry {
  private readonly opts: Required<AnonHttpOptions>;
  private queue: AnonEvent[] = [];
  private sending: Promise<void> = Promise.resolve();

  constructor(opts: AnonHttpOptions) {
    this.opts = {
      now: () => new Date().toISOString(),
      batchSize: 20,
      maxQueue: 200,
      ...opts,
    };
  }

  track(e: TelemetryEvent): void {
    if (!this.opts.identity()) return;
    this.queue = [...this.queue, { ...e, at: toMinute(this.opts.now()) }].slice(
      -this.opts.maxQueue,
    );
    if (this.queue.length >= this.opts.batchSize) void this.flush();
  }

  /** Mengirim antrean (berurutan). Gagal = event disimpan untuk percobaan berikutnya. */
  flush(): Promise<void> {
    this.sending = this.sending.then(async () => {
      const who = this.opts.identity();
      if (!who) {
        this.queue = [];
        return;
      }
      if (this.queue.length === 0) return;
      const batch = this.queue;
      this.queue = [];
      const body = JSON.stringify({ v: 1, installId: who.installId, events: batch });
      const ok = await this.opts.send(this.opts.endpoint, body).catch(() => false);
      if (!ok) this.queue = [...batch, ...this.queue].slice(-this.opts.maxQueue);
    });
    return this.sending;
  }
}

/** Meneruskan setiap event ke beberapa sink (mis. Laporan Belajar lokal + analitik anonim). */
export function combineTelemetry(...sinks: Telemetry[]): Telemetry {
  return {
    track: (e) => sinks.forEach((s) => s.track(e)),
    flush: async () => {
      await Promise.all(sinks.map((s) => s.flush()));
    },
  };
}
