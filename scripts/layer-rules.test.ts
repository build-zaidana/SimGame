import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

async function ruleIds(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => m.ruleId ?? 'fatal');
}

describe('layer rules (ARCHITECTURE §1)', () => {
  it.each([
    ["import { useState } from 'react';", 'no-restricted-imports'],
    ["import { useAppStore } from '../app/store';", 'no-restricted-imports'],
    ["import { x } from '../../modes/soc';", 'no-restricted-imports'],
    ["import { get } from 'idb-keyval';", 'no-restricted-imports'],
    ['export const r = Math.random();', 'no-restricted-properties'],
    ['export const t = Date.now();', 'no-restricted-properties'],
    ['export const d = new Date();', 'no-restricted-syntax'],
    ['export const w = window.innerWidth;', 'no-restricted-globals'],
  ])('engine rejects: %s', async (code, rule) => {
    expect(await ruleIds('src/engine/bad.ts', code)).toContain(rule);
  });

  it('engine allows pure imports', async () => {
    expect(await ruleIds('src/engine/ok.ts', "export { createRng } from './rng';\n")).toEqual([]);
  });

  it('a mode cannot import another mode', async () => {
    const code = "export { x } from '../../support/caseTypes';\n";
    expect(await ruleIds('src/modes/soc/desk/bad.ts', code)).toContain('no-restricted-imports');
  });

  it('a mode can import engine', async () => {
    const code = "export { createRng } from '../../engine/rng';\n";
    expect(await ruleIds('src/modes/soc/ok.ts', code)).toEqual([]);
  });

  it('phaser is only allowed in hub/phaser', async () => {
    const code = "export const load = () => import('phaser');\n";
    expect(await ruleIds('src/app/bad.ts', code)).toContain('no-restricted-syntax');
    expect(await ruleIds('src/engine/bad.ts', code)).toContain('no-restricted-syntax');
    expect(await ruleIds('src/hub/phaser/ok.ts', code)).toEqual([]);
  });

  it('idb-keyval is only allowed in persistence (static and dynamic)', async () => {
    expect(
      await ruleIds('src/app/bad.ts', "import { get } from 'idb-keyval';\nexport { get };\n"),
    ).toContain('no-restricted-imports');
    expect(
      await ruleIds('src/app/bad.ts', "export const l = () => import('idb-keyval');\n"),
    ).toContain('no-restricted-syntax');
    expect(
      await ruleIds('src/persistence/ok.ts', "export const l = () => import('idb-keyval');\n"),
    ).toEqual([]);
  });
});
