import { createEventLog } from '../persistence/EventLogStore.ts';
import { AnonHttpTelemetry, combineTelemetry } from '../telemetry/AnonHttpTelemetry.ts';
import { noopTelemetry } from '../telemetry/NoopTelemetry.ts';
import { SessionReportTelemetry } from '../telemetry/SessionReportTelemetry.ts';
import type { Telemetry } from '../telemetry/Telemetry.ts';

/**
 * Sink telemetri aktif, dipilih lewat VITE_TELEMETRY:
 * - 'session' (bawaan): log lokal di perangkat untuk Laporan Belajar; tidak dikirim ke mana pun.
 * - 'none': tidak mencatat apa pun.
 * Analitik anonim (PRD S6, ADR 018) hanya ada bila build diberi VITE_TELEMETRY_ENDPOINT, dan
 * hanya mengirim setelah pemain menyalakannya di Pengaturan (bawaan: mati).
 */
const mode = import.meta.env['VITE_TELEMETRY'] ?? 'session';
const endpoint = analyticsEndpoint(import.meta.env['VITE_TELEMETRY_ENDPOINT']);

/** Flag di save yang menyimpan persetujuan pemain untuk analitik anonim. */
export const ANALYTICS_OPT_IN = 'analyticsOptIn';

/** Hanya https:// atau path di origin yang sama ("/…"); selain itu analitik dianggap tidak ada. */
export function analyticsEndpoint(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw === '') return null;
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  try {
    return new URL(raw).protocol === 'https:' ? raw : null;
  } catch {
    return null;
  }
}

let identity: () => { installId: string } | null = () => null;

/** Dipanggil store: memberi tahu sink analitik siapa (ID acak) dan apakah boleh mengirim. */
export function bindAnalyticsIdentity(fn: () => { installId: string } | null) {
  identity = fn;
}

async function send(url: string, body: string): Promise<boolean> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  });
  return res.ok;
}

export const sessionReport: SessionReportTelemetry | null =
  mode === 'none' ? null : new SessionReportTelemetry(createEventLog());

const anon =
  mode !== 'none' && endpoint
    ? new AnonHttpTelemetry({ endpoint, identity: () => identity(), send })
    : null;

/** Pengaturan hanya menampilkan pilihan analitik bila build ini memang bisa mengirim. */
export const analyticsAvailable = anon !== null;

const sinks = [sessionReport, anon].filter((s): s is NonNullable<typeof s> => s !== null);

export const telemetry: Telemetry =
  sinks.length === 0 ? noopTelemetry : sinks.length === 1 ? sinks[0]! : combineTelemetry(...sinks);
