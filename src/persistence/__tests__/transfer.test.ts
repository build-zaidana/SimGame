import { describe, expect, it } from 'vitest';
import { createNewSave, SAVE_SCHEMA_VERSION, type SaveData } from '../saveSchema.ts';
import {
  decodeSave,
  encodeJson,
  encodeSave,
  MAX_IMPORT_BYTES,
  summarizeSave,
  type TransferError,
} from '../transfer.ts';

const save = (): SaveData => ({
  ...createNewSave({
    installId: '6f1c2b8e-3a4d-4c5e-8f9a-0b1c2d3e4f5a',
    now: '2026-10-03T10:00:00.000Z',
  }),
  modes: {
    soc: {
      unlockedShift: 3,
      shifts: {
        'soc-01': { bestScore: 90, stars: 3, completedAt: '2026-10-03T10:00:00.000Z' },
        'soc-02': { bestScore: 72, stars: 2, completedAt: '2026-10-03T11:00:00.000Z' },
      },
      wallet: 250,
      trust: 81,
      toolsOwned: ['link-checker'],
      badges: { 'first-day': '2026-10-03T10:00:00.000Z' },
      chaptersUnlocked: ['ch-url', 'ch-phish'],
    },
  },
  mastery: { 'rv-url-1': { box: 2, dueAtShiftIndex: 4, seen: 2, correct: 1 } },
});

async function code(data: SaveData = save(), compress = true) {
  return encodeSave(data, { compress });
}

async function expectCode(text: string, codeName: TransferError['code']) {
  await expect(decodeSave(text)).rejects.toMatchObject({ code: codeName });
}

describe('encodeSave / decodeSave', () => {
  it('roundtrips a save (gzip)', async () => {
    const c = await code();
    expect(c).toMatch(/^SHIFTIT1\.z[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
    expect(await decodeSave(c)).toEqual(save());
  });

  it('roundtrips without compression (fallback)', async () => {
    const c = await code(save(), false);
    expect(c.startsWith('SHIFTIT1.j')).toBe(true);
    expect(await decodeSave(c)).toEqual(save());
  });

  it('ignores surrounding whitespace and line breaks from copy-paste', async () => {
    const c = await code();
    const wrapped = `  ${c.slice(0, 20)}\n${c.slice(20)}  \n`;
    expect(await decodeSave(wrapped)).toEqual(save());
  });

  it('rejects a wrong prefix', async () => {
    await expectCode('HALO.zabc.12345678', 'bad-format');
  });

  it('rejects a truncated code via the checksum', async () => {
    const c = await code();
    const [prefix, payload, sum] = c.split('.');
    await expectCode(`${prefix}.${payload?.slice(0, -4)}.${sum}`, 'bad-checksum');
  });

  it('rejects a code whose content was edited', async () => {
    const c = await code(save(), false);
    const [prefix, payload, sum] = c.split('.');
    const edited =
      (payload ?? '').slice(0, 10) +
      ((payload ?? '')[10] === 'A' ? 'B' : 'A') +
      (payload ?? '').slice(11);
    await expectCode(`${prefix}.${edited}.${sum}`, 'bad-checksum');
  });

  it('rejects input over the size limit before decoding', async () => {
    await expectCode('SHIFTIT1.j' + 'A'.repeat(MAX_IMPORT_BYTES) + '.00000000', 'too-large');
  });

  it('rejects valid JSON that is not a save', async () => {
    await expectCode(await encodeJson({ hello: 1 }), 'invalid-save');
  });

  it('migrates a code exported by an older version', async () => {
    const v1 = { ...JSON.parse(JSON.stringify(save())), schemaVersion: 1 };
    expect((await decodeSave(await encodeJson(v1))).schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });

  it('rejects a code from a newer game version', async () => {
    await expectCode(await encodeJson({ ...save(), schemaVersion: 99 }), 'newer-version');
  });
});

describe('summarizeSave', () => {
  it('summarizes progress for the import confirmation', () => {
    expect(summarizeSave(save())).toEqual({
      shiftsCompleted: 2,
      stars: 5,
      wallet: 250,
      updatedAt: '2026-10-03T10:00:00.000Z',
    });
  });
});
