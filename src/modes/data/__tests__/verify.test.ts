import { describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { verifyDataCase } from '../verify.ts';

const SQL = await initSqlJs();

const table = (rows: (string | number)[][]) => ({
  name: 'jual',
  columns: [
    { name: 'kota', type: 'TEXT' as const },
    { name: 'total', type: 'INTEGER' as const },
  ],
  rows,
});

const queryCase = (over: Record<string, unknown> = {}) => ({
  id: 'q',
  type: 'query',
  data: {
    task: 'fix',
    tables: [
      table([
        ['Bandung', 50],
        ['Medan', 20],
      ]),
    ],
    hidden: [
      {
        tables: [
          table([
            ['Solo', 70],
            ['Bogor', 90],
          ]),
        ],
      },
    ],
    starter: 'SELECT kota FROM jual WHERE total < 30',
    solution: 'SELECT kota FROM jual WHERE total > 30',
    ordered: false,
    ...over,
  },
});

describe('verifyDataCase (content:check, ADR 031)', () => {
  it('accepts a well-formed query task', () => {
    expect(verifyDataCase(SQL, queryCase())).toEqual([]);
  });

  it('rejects a reference query that errors or returns nothing', () => {
    expect(verifyDataCase(SQL, queryCase({ solution: 'SELEC kota' })).join()).toMatch(/error/);
    expect(
      verifyDataCase(
        SQL,
        queryCase({ solution: 'SELECT kota FROM jual WHERE total > 999' }),
      ).join(),
    ).toMatch(/kosong/);
  });

  it('requires hidden data that gives a different answer, with the same tables', () => {
    const same = queryCase({
      hidden: [
        {
          tables: [
            table([
              ['Bandung', 50],
              ['Medan', 20],
            ]),
          ],
        },
      ],
    });
    expect(verifyDataCase(SQL, same).join()).toMatch(/sama/);
    const renamed = queryCase({
      hidden: [{ tables: [{ ...table([['Solo', 70]]), name: 'beli' }] }],
    });
    expect(verifyDataCase(SQL, renamed).join()).toMatch(/tabel/);
  });

  it('a fix task must start from a query that fails, and ordered tasks need ORDER BY', () => {
    expect(
      verifyDataCase(SQL, queryCase({ starter: 'SELECT kota FROM jual WHERE total > 30' })).join(),
    ).toMatch(/kode awal/);
    expect(verifyDataCase(SQL, queryCase({ ordered: true })).join()).toMatch(/ORDER BY/);
  });

  it('ignores other case types', () => {
    expect(verifyDataCase(SQL, { id: 'c', type: 'chart', data: {} })).toEqual([]);
  });
});
