/// <reference lib="webworker" />
/**
 * Web Worker MicroPython (ADR 026): kode pemain berjalan di luar thread UI, jadi loop tak berujung
 * tidak membekukan game. Pemanggil mematikan worker ini bila melewati batas waktu.
 */
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import wasmUrl from '@micropython/micropython-webassembly-pyscript/micropython.wasm?url';
import { runWithTests, type PyTest } from './harness.ts';

export interface RunRequest {
  id: number;
  code: string;
  tests: PyTest[];
}

const scope = self as unknown as DedicatedWorkerGlobalScope;
scope.addEventListener('message', (e: MessageEvent<RunRequest>) => {
  const { id, code, tests } = e.data;
  runWithTests(loadMicroPython, code, tests, { url: wasmUrl }).then(
    (result) => scope.postMessage({ id, result }),
    (err: unknown) => scope.postMessage({ id, fatal: String(err) }),
  );
});
