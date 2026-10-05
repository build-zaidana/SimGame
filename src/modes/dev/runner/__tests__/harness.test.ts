import { describe, expect, it } from 'vitest';
import { loadMicroPython } from '@micropython/micropython-webassembly-pyscript';
import { runWithTests } from '../harness.ts';

const tests = [
  { name: 'jumlah biasa', code: 'assert total([1, 2, 3]) == 6' },
  { name: 'daftar kosong', code: 'assert total([]) == 0, "total([]) harus 0"', hidden: true },
];

describe('runWithTests (MicroPython)', () => {
  it('passes every test for a correct solution and captures print output', async () => {
    const code =
      'def total(xs):\n    s = 0\n    for x in xs:\n        s += x\n    return s\nprint("siap")';
    const r = await runWithTests(loadMicroPython, code, tests);
    expect(r.error).toBeUndefined();
    expect(r.output).toEqual(['siap']);
    expect(r.tests.map((t) => t.passed)).toEqual([true, true]);
    expect(r.tests[1]).toMatchObject({ hidden: true });
  });

  it('reports the failing assertion message per test', async () => {
    const code = 'def total(xs):\n    if not xs:\n        return None\n    return sum(xs)';
    const r = await runWithTests(loadMicroPython, code, tests);
    expect(r.tests[0]).toMatchObject({ passed: true });
    expect(r.tests[1]).toMatchObject({
      passed: false,
      message: 'AssertionError: total([]) harus 0',
    });
  });

  it('shows what the code returned vs what was expected for a plain == assertion', async () => {
    const code = 'def total(xs):\n    return 7';
    const r = await runWithTests(loadMicroPython, code, tests);
    expect(r.tests[0]).toMatchObject({ passed: false, got: '7', expected: '6' });
    // Probe tidak boleh mengotori keluaran print pemain.
    expect(r.output).toEqual([]);
  });

  it('fails all tests with the error line when the code itself crashes', async () => {
    const r = await runWithTests(loadMicroPython, 'def total(xs:\n    return 0', tests);
    expect(r.error).toMatchObject({ text: 'SyntaxError: invalid syntax' });
    expect(r.tests.every((t) => !t.passed)).toBe(true);
  });

  it('points at the line of a runtime error and explains unsupported slicing', async () => {
    const r = await runWithTests(loadMicroPython, 'x = 1\ny = "abc"[::-1]', []);
    expect(r.error).toMatchObject({ line: 2, hint: 'slice-step' });
  });

  it('starts from a fresh interpreter every run', async () => {
    await runWithTests(loadMicroPython, 'rahasia = 1', []);
    const r = await runWithTests(loadMicroPython, 'print(rahasia)', []);
    expect(r.error?.text).toMatch(/NameError/);
  });

  it('caps very long output', async () => {
    const r = await runWithTests(loadMicroPython, 'for i in range(500):\n    print(i)', []);
    expect(r.output.length).toBeLessThanOrEqual(101);
    expect(r.truncated).toBe(true);
  });
});
