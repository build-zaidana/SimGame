/**
 * Harness SQL Meja Data (ADR 031): menjalankan query pemain dan query acuan di database SQLite baru
 * untuk setiap set data, lalu membandingkan hasilnya. Murni (tanpa DOM): modul sql.js disuntikkan,
 * sehingga worker, unit test, dan content:check memakai kode yang sama persis.
 */
import type { Database, SqlJsStatic, SqlValue } from 'sql.js';

export type Cell = string | number | null;

export interface SqlColumn {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'REAL';
}

export interface SqlTable {
  name: string;
  columns: SqlColumn[];
  rows: Cell[][];
}

/** Satu set data. `hidden`: set data uji yang tidak ditampilkan (mencegah menghafal jawaban). */
export interface SqlDataset {
  tables: SqlTable[];
  hidden?: boolean | undefined;
}

export interface QueryResult {
  columns: string[];
  rows: Cell[][];
  /** Hasil dipotong karena terlalu banyak baris. */
  truncated?: boolean;
}

export interface DatasetRun {
  hidden: boolean;
  passed: boolean;
  /** Hasil query pemain (tidak ada bila query error). */
  got?: QueryResult;
  /** Hasil yang diminta; hanya untuk set data yang terlihat. */
  expected?: QueryResult;
}

export interface SqlRunResult {
  datasets: DatasetRun[];
  /** `empty`: belum ada perintah SQL; `sql`: error dari SQLite. */
  error?: { kind: 'empty' | 'sql'; text: string };
}

/** Baris maksimum yang dikirim ke UI. */
export const MAX_RESULT_ROWS = 100;

function quoteIdent(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

function load(SQL: SqlJsStatic, data: SqlDataset): Database {
  const db = new SQL.Database();
  for (const t of data.tables) {
    const cols = t.columns.map((c) => `${quoteIdent(c.name)} ${c.type}`).join(', ');
    db.run(`CREATE TABLE ${quoteIdent(t.name)} (${cols})`);
    const marks = t.columns.map(() => '?').join(', ');
    const insert = db.prepare(`INSERT INTO ${quoteIdent(t.name)} VALUES (${marks})`);
    for (const row of t.rows) insert.run(row);
    insert.free();
  }
  return db;
}

const toCell = (v: SqlValue): Cell => (v instanceof Uint8Array ? '[blob]' : v);

/** Hasil pernyataan terakhir yang mengembalikan data; tanpa hasil = tabel kosong. */
function query(SQL: SqlJsStatic, data: SqlDataset, sql: string): QueryResult {
  const db = load(SQL, data);
  try {
    const results = db.exec(sql);
    const last = results[results.length - 1];
    if (!last) return { columns: [], rows: [] };
    const rows = last.values.map((r) => r.map(toCell));
    return {
      columns: last.columns,
      rows: rows.slice(0, MAX_RESULT_ROWS),
      ...(rows.length > MAX_RESULT_ROWS ? { truncated: true } : {}),
    };
  } finally {
    db.close();
  }
}

/** Komentar & spasi saja dianggap belum ada query. */
function isBlank(sql: string): boolean {
  return (
    sql
      .replace(/--[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/;/g, '')
      .trim() === ''
  );
}

const norm = (c: Cell): Cell => (typeof c === 'number' ? Math.round(c * 100) / 100 : c);

/**
 * Sama bila jumlah kolom dan semua nilai sama (angka dibulatkan 2 desimal). Nama kolom diabaikan
 * (alias bebas); urutan baris hanya dihitung bila tugas memintanya (`ORDER BY`).
 */
export function sameResult(got: QueryResult, expected: QueryResult, ordered: boolean): boolean {
  if (got.columns.length !== expected.columns.length) return false;
  if (got.rows.length !== expected.rows.length) return false;
  const key = (rows: Cell[][]) => rows.map((r) => JSON.stringify(r.map(norm)));
  const a = key(got.rows);
  const b = key(expected.rows);
  if (!ordered) {
    a.sort();
    b.sort();
  }
  return a.every((x, i) => x === b[i]);
}

export function runQueryChecks(
  SQL: SqlJsStatic,
  playerSql: string,
  solutionSql: string,
  datasets: readonly SqlDataset[],
  opts: { ordered: boolean },
): SqlRunResult {
  if (isBlank(playerSql)) {
    return {
      datasets: datasets.map((d) => ({ hidden: !!d.hidden, passed: false })),
      error: { kind: 'empty', text: '' },
    };
  }
  let error: SqlRunResult['error'];
  const runs = datasets.map((d): DatasetRun => {
    const expected = query(SQL, d, solutionSql);
    const shown = d.hidden ? {} : { expected };
    try {
      const got = query(SQL, d, playerSql);
      return {
        hidden: !!d.hidden,
        passed: sameResult(got, expected, opts.ordered),
        // Hasil pemain di set data tersembunyi juga tidak dikirim: cukup lulus/gagal.
        ...(d.hidden ? {} : { got }),
        ...shown,
      };
    } catch (e) {
      error ??= { kind: 'sql', text: e instanceof Error ? e.message : String(e) };
      return { hidden: !!d.hidden, passed: false, ...shown };
    }
  });
  return { datasets: runs, ...(error ? { error } : {}) };
}
