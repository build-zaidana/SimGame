/**
 * Pemeriksaan konten Meja Data yang butuh menjalankan SQL (dipakai content:check, ADR 031): query
 * acuan berjalan dan tidak kosong, set data tersembunyi punya tabel yang sama tapi jawaban berbeda
 * (agar menghafal hasil tidak lulus), dan query awal tugas "perbaiki" memang salah.
 */
import type { SqlJsStatic } from 'sql.js';
import { runQueryChecks, type SqlDataset, type SqlTable } from './runner/sqlHarness.ts';

interface DataCaseLike {
  id: string;
  type: string;
  data: unknown;
}

const shape = (tables: readonly SqlTable[]) =>
  JSON.stringify(tables.map((t) => [t.name, t.columns]));

export function verifyDataCase(SQL: SqlJsStatic, c: DataCaseLike): string[] {
  if (c.type !== 'query') return [];
  const d = c.data as {
    task: 'fix' | 'build';
    tables: SqlTable[];
    hidden: { tables: SqlTable[] }[];
    starter: string;
    solution: string;
    ordered: boolean;
  };
  try {
    return check(SQL, d);
  } catch (e) {
    return [`query acuan error: ${e instanceof Error ? e.message : String(e)}`];
  }
}

function check(
  SQL: SqlJsStatic,
  d: {
    task: 'fix' | 'build';
    tables: SqlTable[];
    hidden: { tables: SqlTable[] }[];
    starter: string;
    solution: string;
    ordered: boolean;
  },
): string[] {
  const errors: string[] = [];
  d.hidden.forEach((h, i) => {
    if (shape(h.tables) !== shape(d.tables))
      errors.push(
        `set data tersembunyi ${i + 1}: nama tabel/kolom harus sama dengan data terlihat`,
      );
  });
  if (errors.length) return errors;

  const datasets: SqlDataset[] = [
    { tables: d.tables },
    ...d.hidden.map((h) => ({ tables: h.tables, hidden: true })),
  ];
  // Query acuan dibandingkan dengan dirinya sendiri: harus lulus tanpa error dan tidak kosong.
  const visible = runQueryChecks(SQL, d.solution, d.solution, [datasets[0]!], { ordered: true });
  if (visible.error) return [`query acuan error: ${visible.error.text}`];
  const expected = visible.datasets[0]?.expected;
  if (!expected?.rows.length) errors.push('hasil query acuan kosong di data terlihat');

  // Menjawab dengan "hasil data terlihat" harus gagal di setiap set data tersembunyi.
  for (let i = 1; i < datasets.length; i++) {
    const probe = runQueryChecks(SQL, d.solution, d.solution, [{ tables: datasets[i]!.tables }], {
      ordered: true,
    });
    const hiddenRows = probe.datasets[0]?.expected?.rows ?? [];
    if (!hiddenRows.length) errors.push(`hasil query acuan kosong di set data tersembunyi ${i}`);
    if (JSON.stringify(hiddenRows) === JSON.stringify(expected?.rows ?? []))
      errors.push(`set data tersembunyi ${i} memberi hasil yang sama dengan data terlihat`);
  }

  if (d.task === 'fix') {
    const start = runQueryChecks(SQL, d.starter, d.solution, datasets, { ordered: d.ordered });
    if (start.datasets.every((x) => x.passed)) errors.push('kode awal sudah lulus semua set data');
  }
  if (d.ordered && !/order\s+by/i.test(d.solution))
    errors.push('tugas berurutan (ordered) tapi query acuan tanpa ORDER BY');
  return errors;
}
