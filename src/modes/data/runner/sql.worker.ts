/// <reference lib="webworker" />
/**
 * Web Worker SQLite (sql.js, ADR 031): query pemain berjalan di luar thread UI, jadi query yang tidak
 * pernah selesai (mis. WITH RECURSIVE tanpa batas) tidak membekukan game. Pemanggil mematikan worker
 * ini bila melewati batas waktu.
 */
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { runQueryChecks, type SqlDataset } from './sqlHarness.ts';

export interface SqlRequest {
  id: number;
  sql: string;
  solution: string;
  datasets: SqlDataset[];
  ordered: boolean;
}

let engine: Promise<SqlJsStatic> | null = null;

const scope = self as unknown as DedicatedWorkerGlobalScope;
scope.addEventListener('message', (e: MessageEvent<SqlRequest>) => {
  const req = e.data;
  engine ??= initSqlJs({ locateFile: () => wasmUrl });
  engine
    .then((SQL) =>
      runQueryChecks(SQL, req.sql, req.solution, req.datasets, { ordered: req.ordered }),
    )
    .then(
      (result) => scope.postMessage({ id: req.id, result }),
      (err: unknown) => scope.postMessage({ id: req.id, fatal: String(err) }),
    );
});
