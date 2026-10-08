import { describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { runQueryChecks, sameResult, type SqlDataset } from '../sqlHarness.ts';

const SQL = await initSqlJs();

const nilai = (rows: (string | number)[][]): SqlDataset => ({
  tables: [
    {
      name: 'nilai',
      columns: [
        { name: 'nama', type: 'TEXT' },
        { name: 'kelas', type: 'TEXT' },
        { name: 'skor', type: 'INTEGER' },
      ],
      rows,
    },
  ],
});

const visible = nilai([
  ['Ayu', 'X-1', 80],
  ['Budi', 'X-2', 65],
  ['Citra', 'X-1', 90],
]);
const hidden = {
  ...nilai([
    ['Dodi', 'X-3', 70],
    ['Eka', 'X-3', 75],
  ]),
  hidden: true,
};
const solution = 'SELECT nama FROM nilai WHERE skor >= 75 ORDER BY nama';

describe('runQueryChecks (sql.js)', () => {
  it('passes every dataset when the query matches the reference result', () => {
    const r = runQueryChecks(
      SQL,
      'select nama from nilai where skor > 74 order by nama;',
      solution,
      [visible, hidden],
      { ordered: true },
    );
    expect(r.error).toBeUndefined();
    expect(r.datasets.map((d) => d.passed)).toEqual([true, true]);
    expect(r.datasets[0]?.got?.rows).toEqual([['Ayu'], ['Citra']]);
    expect(r.datasets[0]?.expected?.rows).toEqual([['Ayu'], ['Citra']]);
  });

  it('catches a query that only works on the visible data (hidden dataset)', () => {
    const hardcoded = "SELECT nama FROM nilai WHERE nama IN ('Ayu', 'Citra') ORDER BY nama";
    const r = runQueryChecks(SQL, hardcoded, solution, [visible, hidden], { ordered: true });
    expect(r.datasets.map((d) => d.passed)).toEqual([true, false]);
    // Hasil yang diharapkan untuk data tersembunyi tidak dikirim ke UI.
    expect(r.datasets[1]?.expected).toBeUndefined();
    expect(r.datasets[1]?.hidden).toBe(true);
  });

  it('ignores row order unless the task asks for it, and column names always', () => {
    const r = runQueryChecks(
      SQL,
      'SELECT nama AS siswa FROM nilai WHERE skor >= 75 ORDER BY skor DESC',
      solution,
      [visible],
      { ordered: false },
    );
    expect(r.datasets[0]?.passed).toBe(true);
    const strict = runQueryChecks(
      SQL,
      'SELECT nama FROM nilai WHERE skor >= 75 ORDER BY skor DESC',
      solution,
      [visible],
      { ordered: true },
    );
    expect(strict.datasets[0]?.passed).toBe(false);
  });

  it('compares numbers with two decimals so AVG results are not flaky', () => {
    expect(
      sameResult({ columns: ['a'], rows: [[76.66666]] }, { columns: ['x'], rows: [[76.67]] }, true),
    ).toBe(true);
    expect(
      sameResult({ columns: ['a'], rows: [[1]] }, { columns: ['a', 'b'], rows: [[1, 2]] }, true),
    ).toBe(false);
  });

  it('reports a syntax error as a friendly failure on every dataset', () => {
    const r = runQueryChecks(SQL, 'SELEC nama FROM nilai', solution, [visible, hidden], {
      ordered: true,
    });
    expect(r.error?.text).toMatch(/syntax error/);
    expect(r.datasets.every((d) => !d.passed)).toBe(true);
  });

  it('uses the last statement and treats an empty query as a failure', () => {
    const r = runQueryChecks(SQL, 'SELECT 1; ' + solution, solution, [visible], { ordered: true });
    expect(r.datasets[0]?.passed).toBe(true);
    const empty = runQueryChecks(SQL, '-- tulis query di sini', solution, [visible], {
      ordered: true,
    });
    expect(empty.datasets[0]?.passed).toBe(false);
    expect(empty.error?.kind).toBe('empty');
  });

  it('cannot change the data between datasets (a fresh database every run)', () => {
    const r = runQueryChecks(
      SQL,
      'DELETE FROM nilai; SELECT nama FROM nilai',
      solution,
      [visible, hidden],
      { ordered: true },
    );
    expect(r.datasets.map((d) => d.passed)).toEqual([false, false]);
    const again = runQueryChecks(SQL, solution, solution, [visible], { ordered: true });
    expect(again.datasets[0]?.passed).toBe(true);
  });

  it('cuts very large results', () => {
    const r = runQueryChecks(
      SQL,
      'WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM n WHERE i < 500) SELECT i FROM n',
      solution,
      [visible],
      { ordered: true },
    );
    expect(r.datasets[0]?.got?.rows).toHaveLength(100);
    expect(r.datasets[0]?.got?.truncated).toBe(true);
  });
});
