import { describe, expect, it, vi } from 'vitest';
import { startShift } from '../../engine/shift.ts';
import { LocalSaveRepository, memoryStore, SAVE_KEY } from '../LocalSaveRepository.ts';
import { migrate, runMigrations, SaveFormatError } from '../migrations.ts';
import { createNewSave, SAVE_SCHEMA_VERSION, type SaveData } from '../saveSchema.ts';

const INSTALL_ID = '6f1c2b8e-3a4d-4c5e-8f9a-0b1c2d3e4f5a';
const NOW = '2026-10-03T10:00:00.000Z';

function saveWithSession(): SaveData {
  const save = createNewSave({ installId: INSTALL_ID, now: NOW });
  const session = startShift({
    plan: {
      shiftId: 'soc-01',
      modeId: 'soc',
      order: 1,
      durationGameMinutes: 10,
      realSecondsPerGameMinute: 1,
      cases: [{ caseId: 'a', arriveAt: 0 }],
    },
    seed: 7,
    playMode: 'relaxed',
    trust: 75,
  });
  return {
    ...save,
    modes: {
      soc: {
        unlockedShift: 1,
        shifts: {},
        wallet: 0,
        trust: 75,
        toolsOwned: [],
        chaptersUnlocked: [],
        activeSession: session,
      },
    },
  };
}

describe('saveSchema', () => {
  it('a new save is valid and current', () => {
    const save = createNewSave({ installId: INSTALL_ID, now: NOW });
    expect(save.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });

  it('a save with an active session survives a JSON roundtrip', () => {
    const save = saveWithSession();
    expect(migrate(JSON.parse(JSON.stringify(save)))).toEqual(save);
  });
});

describe('migrate', () => {
  it.each([
    ['not an object', 'hello', 'not-object'],
    ['no version', { foo: 1 }, 'no-version'],
    ['newer version', { schemaVersion: SAVE_SCHEMA_VERSION + 1 }, 'newer-version'],
    ['invalid shape', { schemaVersion: SAVE_SCHEMA_VERSION, installId: 'x' }, 'invalid'],
  ])('rejects %s', (_name, raw, code) => {
    expect(() => migrate(raw)).toThrow(SaveFormatError);
    try {
      migrate(raw);
    } catch (e) {
      expect((e as SaveFormatError).code).toBe(code);
    }
  });

  it('runs migrations in order up to the target version', () => {
    const migrations = {
      1: (d: Record<string, unknown>) => ({ ...d, a: 1 }),
      2: (d: Record<string, unknown>) => ({ ...d, b: (d['a'] as number) + 1 }),
    };
    expect(runMigrations({ schemaVersion: 1 }, migrations, 3)).toEqual({
      schemaVersion: 3,
      a: 1,
      b: 2,
    });
  });

  it('fails when a migration step is missing', () => {
    expect(() => runMigrations({ schemaVersion: 1 }, {}, 2)).toThrow(/missing-migration|v1/);
  });
});

describe('LocalSaveRepository', () => {
  it('returns null when nothing is saved', async () => {
    expect(await new LocalSaveRepository(memoryStore()).load()).toBeNull();
  });

  it('save → load roundtrip', async () => {
    const repo = new LocalSaveRepository(memoryStore());
    const save = saveWithSession();
    await repo.save(save);
    expect(await repo.load()).toEqual(save);
  });

  it('moves the previous save to the backup slot', async () => {
    const repo = new LocalSaveRepository(memoryStore());
    const first = createNewSave({ installId: INSTALL_ID, now: NOW });
    const second = { ...first, updatedAt: '2026-10-03T11:00:00.000Z' };
    await repo.save(first);
    await repo.save(second);
    expect(await repo.load()).toEqual(second);
    expect(await repo.loadBackup()).toEqual(first);
  });

  it('throws SaveFormatError for a corrupt save, backup still loads', async () => {
    const store = memoryStore();
    const repo = new LocalSaveRepository(store);
    const good = createNewSave({ installId: INSTALL_ID, now: NOW });
    await repo.save(good);
    await repo.save(good);
    await store.set(SAVE_KEY, { schemaVersion: 1, broken: true });
    await expect(repo.load()).rejects.toBeInstanceOf(SaveFormatError);
    expect(await repo.loadBackup()).toEqual(good);
  });

  it('clear removes save and backup', async () => {
    const repo = new LocalSaveRepository(memoryStore());
    const save = createNewSave({ installId: INSTALL_ID, now: NOW });
    await repo.save(save);
    await repo.save(save);
    await repo.clear();
    expect(await repo.load()).toBeNull();
    expect(await repo.loadBackup()).toBeNull();
  });

  it('requests persistent storage once, on the first save', async () => {
    const persist = vi.fn(async () => true);
    const repo = new LocalSaveRepository(memoryStore(), persist);
    const save = createNewSave({ installId: INSTALL_ID, now: NOW });
    await repo.save(save);
    await repo.save(save);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('stored data is a copy, not a live reference', async () => {
    const repo = new LocalSaveRepository(memoryStore());
    const save = createNewSave({ installId: INSTALL_ID, now: NOW });
    await repo.save(save);
    save.flags['x'] = true;
    expect((await repo.load())?.flags).toEqual({});
  });
});
