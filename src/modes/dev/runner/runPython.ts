import type { PyTest, RunResult } from './harness.ts';
import type { RunRequest } from './py.worker.ts';

/** Batas waktu satu kali "Jalankan" (ms); lewat dari ini dianggap loop tak berujung. */
export const RUN_TIMEOUT_MS = 4000;

export type RunOutcome =
  { kind: 'done'; result: RunResult } | { kind: 'timeout' } | { kind: 'failed'; message: string };

let worker: Worker | null = null;
let seq = 0;

function getWorker(): Worker {
  worker ??= new Worker(new URL('./py.worker.ts', import.meta.url), { type: 'module' });
  return worker;
}

/** Memuat MicroPython lebih awal (saat Meja Developer dibuka) agar "Jalankan" pertama cepat. */
export function warmUpPython(): void {
  void runPython('pass', [], RUN_TIMEOUT_MS * 3);
}

/** Menjalankan kode + tes di worker. Satu permintaan pada satu waktu (tombol dikunci UI). */
export function runPython(
  code: string,
  tests: readonly PyTest[],
  timeoutMs = RUN_TIMEOUT_MS,
): Promise<RunOutcome> {
  const w = getWorker();
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      w.removeEventListener('message', onMessage);
      // Interpreter terjebak loop: matikan worker; permintaan berikutnya membuat yang baru.
      w.terminate();
      if (worker === w) worker = null;
      resolve({ kind: 'timeout' });
    }, timeoutMs);
    function onMessage(e: MessageEvent<{ id: number; result?: RunResult; fatal?: string }>) {
      if (e.data.id !== id) return;
      window.clearTimeout(timer);
      w.removeEventListener('message', onMessage);
      resolve(
        e.data.result
          ? { kind: 'done', result: e.data.result }
          : { kind: 'failed', message: e.data.fatal ?? 'unknown' },
      );
    }
    w.addEventListener('message', onMessage);
    const request: RunRequest = { id, code, tests: [...tests] };
    w.postMessage(request);
  });
}
