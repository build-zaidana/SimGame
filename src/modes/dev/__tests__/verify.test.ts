import { describe, expect, it } from 'vitest';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { verifyDevCase } from '../verify.ts';

const coding = (starter: string, solution: string) => ({
  id: 'c-1',
  type: 'coding',
  data: {
    starter,
    solution,
    tests: [{ name: 'satu', code: 'assert dua() == 2' }],
  },
});

describe('verifyDevCase (content:check runs the reference code)', () => {
  it('accepts a solution that passes and a starter that fails', async () => {
    const errors = await verifyDevCase(
      loadMicroPython,
      coding('def dua():\n    return 1', 'def dua():\n    return 2'),
    );
    expect(errors).toEqual([]);
  });

  it('rejects a solution that fails a test', async () => {
    const errors = await verifyDevCase(
      loadMicroPython,
      coding('def dua():\n    return 1', 'def dua():\n    return 3'),
    );
    expect(errors.join()).toMatch(/solusi acuan gagal tes "satu"/);
  });

  it('rejects a starter that already passes (nothing to fix)', async () => {
    const errors = await verifyDevCase(
      loadMicroPython,
      coding('def dua():\n    return 2', 'def dua():\n    return 2'),
    );
    expect(errors.join()).toMatch(/kode awal sudah lulus semua tes/);
  });

  it('checks that a CTF solution prints the flag', async () => {
    const ctf = (solution: string) => ({
      id: 'f-1',
      type: 'ctf',
      data: { flag: 'FLAG{ok}', solution, scratch: 'print(1)' },
    });
    expect(await verifyDevCase(loadMicroPython, ctf('print("FLAG{" + "ok}")'))).toEqual([]);
    expect((await verifyDevCase(loadMicroPython, ctf('print("x")'))).join()).toMatch(
      /tidak mencetak bendera/,
    );
  });
});

describe('verifyDevCase (robot)', () => {
  const map = { grid: ['#####', '#.PT#', '#####'], start: { x: 1, y: 1, dir: 'E' as const } };
  const robot = (starter: string, solution: string, maps = [map]) => ({
    id: 'r-1',
    type: 'robot',
    data: { maps, starter, solution },
  });
  it('accepts a solution that delivers on every map', async () => {
    expect(
      await verifyDevCase(loadMicroPython, robot('maju()', 'maju()\nambil()\nmaju()\nantar()')),
    ).toEqual([]);
  });
  it('rejects a broken map or a failing solution', async () => {
    const bad = { ...map, grid: ['#####', '#..T#', '#####'] };
    expect((await verifyDevCase(loadMicroPython, robot('maju()', 'maju()', [bad]))).join()).toMatch(
      /belum ada paket/,
    );
    expect((await verifyDevCase(loadMicroPython, robot('maju()', 'maju()'))).join()).toMatch(
      /solusi acuan gagal di peta 1/,
    );
  });
});
