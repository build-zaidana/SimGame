/// <reference lib="webworker" />
/**
 * Web Worker MicroPython (ADR 026): kode pemain berjalan di luar thread UI, jadi loop tak berujung
 * tidak membekukan game. Pemanggil mematikan worker ini bila melewati batas waktu.
 */
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import wasmUrl from '@micropython/micropython-webassembly-pyscript/micropython.wasm?url';
import { runWithTests, type PyTest } from './harness.ts';
import { runRobot, type RobotMap } from './robot.ts';

export type RunRequest =
  | { id: number; kind: 'tests'; code: string; tests: PyTest[] }
  | { id: number; kind: 'robot'; code: string; maps: RobotMap[] };

const scope = self as unknown as DedicatedWorkerGlobalScope;
scope.addEventListener('message', (e: MessageEvent<RunRequest>) => {
  const req = e.data;
  const run =
    req.kind === 'robot'
      ? runRobot(loadMicroPython, req.code, req.maps, { url: wasmUrl })
      : runWithTests(loadMicroPython, req.code, req.tests, { url: wasmUrl });
  run.then(
    (result) => scope.postMessage({ id: req.id, result }),
    (err: unknown) => scope.postMessage({ id: req.id, fatal: String(err) }),
  );
});
