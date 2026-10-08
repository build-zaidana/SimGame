import type { SqlDataset, SqlRunResult } from './sqlHarness.ts';
import type { SqlRequest } from './sql.worker.ts';

/** Batas waktu satu kali "Jalankan" (ms); lewat dari ini query dianggap tidak pernah selesai. */
export const SQL_TIMEOUT_MS = 4000;

export type SqlOutcome =
  | { kind: 'done'; result: SqlRunResult }
  | { kind: 'timeout' }
  | { kind: 'failed'; message: string };

let worker: Worker | null = null;
let seq = 0;

function getWorker(): Worker {
  worker ??= new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' });
  return worker;
}

/** Menjalankan query pemain + query acuan di semua set data, di worker. */
export function runSql(
  sql: string,
  solution: string,
  datasets: readonly SqlDataset[],
  ordered: boolean,
  timeoutMs = SQL_TIMEOUT_MS,
): Promise<SqlOutcome> {
  const w = getWorker();
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      w.removeEventListener('message', onMessage);
      // Query terjebak: matikan worker; permintaan berikutnya membuat yang baru.
      w.terminate();
      if (worker === w) worker = null;
      resolve({ kind: 'timeout' });
    }, timeoutMs);
    function onMessage(e: MessageEvent<{ id: number; result?: SqlRunResult; fatal?: string }>) {
      if (e.data.id !== id) return;
      window.clearTimeout(timer);
      w.removeEventListener('message', onMessage);
      resolve(
        e.data.result !== undefined
          ? { kind: 'done', result: e.data.result }
          : { kind: 'failed', message: e.data.fatal ?? 'unknown' },
      );
    }
    w.addEventListener('message', onMessage);
    const req: SqlRequest = { id, sql, solution, datasets: [...datasets], ordered };
    w.postMessage(req);
  });
}

/** Memuat SQLite lebih awal (saat Meja Data dibuka) agar "Jalankan" pertama cepat. */
export function warmUpSql(): void {
  void runSql('SELECT 1', 'SELECT 1', [], false, SQL_TIMEOUT_MS * 3);
}
