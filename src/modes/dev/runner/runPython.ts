import type { PyTest, RunResult } from './harness.ts';
import type { RunRequest } from './py.worker.ts';
import type { RobotMap, RobotResult } from './robot.ts';

/** Batas waktu satu kali "Jalankan" (ms); lewat dari ini dianggap loop tak berujung. */
export const RUN_TIMEOUT_MS = 4000;

export type Outcome<T> =
  { kind: 'done'; result: T } | { kind: 'timeout' } | { kind: 'failed'; message: string };
export type RunOutcome = Outcome<RunResult>;
export type RobotOutcome = Outcome<RobotResult>;
/** Isi permintaan tanpa id (per varian union). */
type RequestBody = RunRequest extends infer R
  ? R extends RunRequest
    ? Omit<R, 'id'>
    : never
  : never;

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

/** Mengirim satu permintaan ke worker; lewat batas waktu worker dimatikan & dibuat ulang nanti. */
function request<T>(body: RequestBody, timeoutMs: number): Promise<Outcome<T>> {
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
    function onMessage(e: MessageEvent<{ id: number; result?: T; fatal?: string }>) {
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
    w.postMessage({ ...body, id } as RunRequest);
  });
}

/** Menjalankan kode + tes di worker. Satu permintaan pada satu waktu (tombol dikunci UI). */
export function runPython(
  code: string,
  tests: readonly PyTest[],
  timeoutMs = RUN_TIMEOUT_MS,
): Promise<RunOutcome> {
  return request<RunResult>({ kind: 'tests', code, tests: [...tests] }, timeoutMs);
}

/** Menjalankan program robot di setiap peta. */
export function runRobotProgram(
  code: string,
  maps: readonly RobotMap[],
  timeoutMs = RUN_TIMEOUT_MS,
): Promise<RobotOutcome> {
  return request<RobotResult>({ kind: 'robot', code, maps: [...maps] }, timeoutMs);
}
