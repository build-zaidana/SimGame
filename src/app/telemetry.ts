import { createEventLog } from '../persistence/EventLogStore.ts';
import { noopTelemetry } from '../telemetry/NoopTelemetry.ts';
import { SessionReportTelemetry } from '../telemetry/SessionReportTelemetry.ts';
import type { Telemetry } from '../telemetry/Telemetry.ts';

/**
 * Sink telemetri aktif, dipilih lewat VITE_TELEMETRY:
 * - 'session' (bawaan): log lokal di perangkat untuk Laporan Belajar; tidak dikirim ke mana pun.
 * - 'none': tidak mencatat apa pun.
 * Analitik anonim yang mengirim data (PRD S6) belum dibangun dan tetap mati secara default.
 */
const mode = import.meta.env['VITE_TELEMETRY'] ?? 'session';

export const sessionReport: SessionReportTelemetry | null =
  mode === 'none' ? null : new SessionReportTelemetry(createEventLog());

export const telemetry: Telemetry = sessionReport ?? noopTelemetry;
