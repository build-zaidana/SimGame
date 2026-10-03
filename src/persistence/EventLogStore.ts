import type { EventLog, LoggedEvent } from '../telemetry/SessionReportTelemetry.ts';
import { detectStore, type KeyValueStore } from './LocalSaveRepository.ts';

export const EVENTS_KEY = 'shiftit:events';

/** Log event lokal untuk Laporan Belajar. Penyimpanan dipilih saat pertama dipakai. */
export function createEventLog(
  storeP: Promise<KeyValueStore> = detectStore().then((d) => d.store),
): EventLog {
  return {
    async load() {
      const raw = await (await storeP).get(EVENTS_KEY);
      return Array.isArray(raw) ? (raw as LoggedEvent[]) : [];
    },
    async save(events) {
      await (await storeP).set(EVENTS_KEY, events);
    },
  };
}
