import { describe, expect, it, vi } from 'vitest';
import { startShift } from '../../engine/shift.ts';
import {
  LocalSaveRepository,
  memoryStore,
  SAVE_KEY,
  type SyncJournal,
} from '../LocalSaveRepository.ts';
import { migrate, runMigrations, SaveFormatError } from '../migrations.ts';
import {
  createNewSave,
  newModeProgress,
  SAVE_SCHEMA_VERSION,
  type SaveData,
} from '../saveSchema.ts';

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
        badges: {},
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

describe('migration v1 → v2 (generatedCases in active sessions)', () => {
  it('adds an empty generatedCases map to saved sessions and bumps the version', () => {
    const v2 = saveWithSession();
    const soc = v2.modes['soc']!;
    const { generatedCases: _g, ...v1Session } = soc.activeSession!;
    const v1 = {
      ...JSON.parse(JSON.stringify(v2)),
      schemaVersion: 1,
      modes: {
        soc: { ...soc, activeSession: v1Session },
        other: { ...soc, activeSession: undefined },
      },
    };
    delete v1.modes.other.activeSession;
    const migrated = migrate(v1);
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.modes['soc']?.activeSession?.generatedCases).toEqual({});
    expect(migrated.modes['other']?.activeSession).toBeUndefined();
  });
});

describe('migration v2 → v3 (separate practice session slot)', () => {
  it('keeps the save as-is and bumps the version; practiceSession is optional', () => {
    const v2 = { ...JSON.parse(JSON.stringify(saveWithSession())), schemaVersion: 2 };
    const migrated = migrate(v2);
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.modes['soc']?.activeSession?.shiftId).toBe('soc-01');
    expect(migrated.modes['soc']?.practiceSession).toBeUndefined();
  });

  it('a v3 save with both a main and a practice session roundtrips', () => {
    const save = saveWithSession();
    const soc = save.modes['soc']!;
    const withPractice = {
      ...save,
      modes: { soc: { ...soc, practiceSession: soc.activeSession! } },
    };
    expect(migrate(JSON.parse(JSON.stringify(withPractice)))).toEqual(withPractice);
  });
});

describe('migration v3 → v4 (badges per mode)', () => {
  it('adds an empty badge map to every mode and bumps the version', () => {
    const v4 = saveWithSession();
    const { badges: _b, ...v3Soc } = v4.modes['soc']!;
    const v3 = {
      ...JSON.parse(JSON.stringify(v4)),
      schemaVersion: 3,
      modes: { soc: v3Soc, other: { ...v3Soc, activeSession: undefined } },
    };
    delete v3.modes.other.activeSession;
    const migrated = migrate(JSON.parse(JSON.stringify(v3)));
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.modes['soc']?.badges).toEqual({});
    expect(migrated.modes['other']?.badges).toEqual({});
    expect(migrated.modes['soc']?.activeSession?.shiftId).toBe('soc-01');
  });

  it('new mode progress starts with no badges', () => {
    expect(newModeProgress().badges).toEqual({});
  });
});

describe('migration v4 → v5 (music setting)', () => {
  const v4With = (sound: boolean) => {
    const save = JSON.parse(JSON.stringify(createNewSave({ installId: INSTALL_ID, now: NOW })));
    delete save.profile.settings.music;
    delete save.profile.settings.language;
    delete save.profile.settings.exploreOffice;
    save.profile.settings.sound = sound;
    return { ...save, schemaVersion: 4 };
  };
  it('turns music on when sound effects were on, and off when they were off', () => {
    expect(migrate(v4With(true)).profile.settings.music).toBe(true);
    expect(migrate(v4With(false)).profile.settings.music).toBe(false);
    expect(migrate(v4With(true)).schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });
});

describe('migration v5 → v6 (language setting)', () => {
  it('keeps old saves in Indonesian', () => {
    const save = JSON.parse(JSON.stringify(createNewSave({ installId: INSTALL_ID, now: NOW })));
    delete save.profile.settings.language;
    delete save.profile.settings.exploreOffice;
    const migrated = migrate({ ...save, schemaVersion: 5 });
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.profile.settings.language).toBe('id');
  });
});

describe('migration v6 → v7 (explorable office setting)', () => {
  it('turns the explorable office on for existing saves', () => {
    const save = JSON.parse(JSON.stringify(createNewSave({ installId: INSTALL_ID, now: NOW })));
    delete save.profile.settings.exploreOffice;
    const migrated = migrate({ ...save, schemaVersion: 6 });
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.profile.settings.exploreOffice).toBe(true);
  });
});

describe('migration v7 → v8 (wider verdicts for IT Support)', () => {
  it('keeps old sessions as they are and accepts the new verdicts', () => {
    const v7 = { ...JSON.parse(JSON.stringify(saveWithSession())), schemaVersion: 7 };
    const migrated = migrate(v7);
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.modes['soc']?.activeSession?.shiftId).toBe('soc-01');
  });
});

describe('migration v8 → v9 (player answers for the Developer desk)', () => {
  it('keeps old sessions valid; cases may now carry an answer', () => {
    const v8 = { ...JSON.parse(JSON.stringify(saveWithSession())), schemaVersion: 8 };
    const migrated = migrate(v8);
    expect(SAVE_SCHEMA_VERSION).toBe(9);
    expect(migrated.schemaVersion).toBe(9);
    const session = migrated.modes['soc']?.activeSession;
    expect(session?.cases[0]?.answer).toBeUndefined();

    const withAnswer = JSON.parse(JSON.stringify(migrated));
    withAnswer.modes.soc.activeSession.cases[0].answer = {
      text: 'print(1)',
      runs: 2,
      passed: 1,
      total: 2,
    };
    expect(migrate(withAnswer).modes['soc']?.activeSession?.cases[0]?.answer?.runs).toBe(2);
  });
});

describe('LocalSaveRepository journal (durable against closing the tab right away)', () => {
  function memoryJournal(): SyncJournal & { value: unknown } {
    return {
      value: undefined,
      get() {
        return this.value;
      },
      set(v) {
        this.value = JSON.parse(JSON.stringify(v));
      },
      del() {
        this.value = undefined;
      },
    };
  }
  const at = (iso: string): SaveData => ({
    ...createNewSave({ installId: INSTALL_ID, now: NOW }),
    updatedAt: iso,
  });

  it('writes the journal synchronously, before the async store write finishes', () => {
    const journal = memoryJournal();
    const repo = new LocalSaveRepository(memoryStore(), async () => true, journal);
    void repo.save(at('2026-10-03T10:00:01.000Z'));
    expect((journal.value as SaveData).updatedAt).toBe('2026-10-03T10:00:01.000Z');
  });

  it('load prefers the journal when it is newer than the store (write was cut off)', async () => {
    const store = memoryStore();
    const journal = memoryJournal();
    const repo = new LocalSaveRepository(store, async () => true, journal);
    await repo.save(at('2026-10-03T10:00:01.000Z'));
    journal.set(at('2026-10-03T10:00:05.000Z')); // tab ditutup sebelum IndexedDB selesai
    expect((await repo.load())?.updatedAt).toBe('2026-10-03T10:00:05.000Z');
  });

  it('load uses the store when the journal is older, missing or corrupt', async () => {
    const journal = memoryJournal();
    const repo = new LocalSaveRepository(memoryStore(), async () => true, journal);
    await repo.save(at('2026-10-03T10:00:05.000Z'));
    journal.set(at('2026-10-03T10:00:01.000Z'));
    expect((await repo.load())?.updatedAt).toBe('2026-10-03T10:00:05.000Z');
    journal.set({ schemaVersion: 1, broken: true });
    expect((await repo.load())?.updatedAt).toBe('2026-10-03T10:00:05.000Z');
    journal.del();
    expect((await repo.load())?.updatedAt).toBe('2026-10-03T10:00:05.000Z');
  });

  it('writes land in call order even when save() is not awaited', async () => {
    const store = memoryStore();
    const repo = new LocalSaveRepository(store);
    void repo.save(at('2026-10-03T10:00:01.000Z'));
    void repo.save(at('2026-10-03T10:00:02.000Z'));
    await repo.save(at('2026-10-03T10:00:03.000Z'));
    expect((await repo.load())?.updatedAt).toBe('2026-10-03T10:00:03.000Z');
    expect((await repo.loadBackup())?.updatedAt).toBe('2026-10-03T10:00:02.000Z');
  });

  it('clear also removes the journal', async () => {
    const journal = memoryJournal();
    const repo = new LocalSaveRepository(memoryStore(), async () => true, journal);
    await repo.save(at('2026-10-03T10:00:01.000Z'));
    await repo.clear();
    expect(journal.value).toBeUndefined();
    expect(await repo.load()).toBeNull();
  });
});
