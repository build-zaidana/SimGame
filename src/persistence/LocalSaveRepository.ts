import { del, get, set } from 'idb-keyval';
import { migrate } from './migrations.ts';
import type { SaveRepository, StorageKind } from './SaveRepository.ts';
import type { SaveData } from './saveSchema.ts';

export const SAVE_KEY = 'shiftit:save';
export const BACKUP_KEY = 'shiftit:save:backup';

export interface KeyValueStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

export const idbStore = (): KeyValueStore => ({ get, set, del });

export const localStorageStore = (ls: Storage = localStorage): KeyValueStore => ({
  async get(key) {
    const raw = ls.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as unknown);
  },
  async set(key, value) {
    ls.setItem(key, JSON.stringify(value));
  },
  async del(key) {
    ls.removeItem(key);
  },
});

export const memoryStore = (): KeyValueStore => {
  const map = new Map<string, unknown>();
  return {
    async get(key) {
      return map.has(key) ? structuredClone(map.get(key)) : undefined;
    },
    async set(key, value) {
      map.set(key, structuredClone(value));
    },
    async del(key) {
      map.delete(key);
    },
  };
};

const defaultPersist = async () => {
  try {
    await globalThis.navigator?.storage?.persist?.();
  } catch {
    // Tidak didukung / ditolak: tetap jalan, pemain diingatkan untuk ekspor save.
  }
};

/**
 * Salinan sinkron save terakhir. IndexedDB itu asinkron: jika tab ditutup tepat setelah sebuah aksi,
 * tulisan bisa terpotong. Jurnal (localStorage) ditulis seketika, dan load() memilih yang lebih baru.
 */
export interface SyncJournal {
  get(): unknown;
  set(value: unknown): void;
  del(): void;
}

export const JOURNAL_KEY = 'shiftit:save:journal';

export const localStorageJournal = (ls: Storage = localStorage): SyncJournal => ({
  get() {
    const raw = ls.getItem(JOURNAL_KEY);
    return raw === null ? undefined : (JSON.parse(raw) as unknown);
  },
  set(value) {
    ls.setItem(JOURNAL_KEY, JSON.stringify(value));
  },
  del() {
    ls.removeItem(JOURNAL_KEY);
  },
});

function tryMigrate(raw: unknown): SaveData | null {
  try {
    return raw === undefined ? null : migrate(raw);
  } catch {
    return null;
  }
}

export class LocalSaveRepository implements SaveRepository {
  private readonly store: KeyValueStore;
  private readonly persist: () => Promise<unknown>;
  private readonly journal: SyncJournal | null;
  private persistRequested = false;
  /** Tulisan ke store diantrekan di sini supaya selalu mendarat sesuai urutan panggilan. */
  private queue: Promise<void> = Promise.resolve();

  constructor(
    store: KeyValueStore,
    persist: () => Promise<unknown> = defaultPersist,
    journal: SyncJournal | null = null,
  ) {
    this.store = store;
    this.persist = persist;
    this.journal = journal;
  }

  async load(): Promise<SaveData | null> {
    const raw = await this.store.get(SAVE_KEY);
    const fromJournal = this.journal ? tryMigrate(safeGet(this.journal)) : null;
    if (raw === undefined) return fromJournal;
    let main: SaveData;
    try {
      main = migrate(raw);
    } catch (e) {
      if (fromJournal) return fromJournal;
      throw e;
    }
    return fromJournal && fromJournal.updatedAt > main.updatedAt ? fromJournal : main;
  }

  async loadBackup(): Promise<SaveData | null> {
    return tryMigrate(await this.store.get(BACKUP_KEY));
  }

  save(data: SaveData): Promise<void> {
    if (!this.persistRequested) {
      this.persistRequested = true;
      void this.persist();
    }
    try {
      this.journal?.set(data);
    } catch {
      // Kuota localStorage penuh / diblokir: tetap simpan ke store utama.
    }
    const run = this.queue.then(async () => {
      const previous = await this.store.get(SAVE_KEY);
      if (previous !== undefined) await this.store.set(BACKUP_KEY, previous);
      await this.store.set(SAVE_KEY, data);
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async clear(): Promise<void> {
    await this.queue;
    this.journal?.del();
    await this.store.del(SAVE_KEY);
    await this.store.del(BACKUP_KEY);
  }
}

function safeGet(journal: SyncJournal): unknown {
  try {
    return journal.get();
  } catch {
    return undefined;
  }
}

async function works(store: KeyValueStore): Promise<boolean> {
  try {
    await store.set('shiftit:probe', 1);
    await store.del('shiftit:probe');
    return true;
  } catch {
    return false;
  }
}

/** Penyimpanan terbaik yang tersedia: IndexedDB → localStorage → memori. */
export async function detectStore(): Promise<{ store: KeyValueStore; kind: StorageKind }> {
  if (typeof indexedDB !== 'undefined' && (await works(idbStore()))) {
    return { store: idbStore(), kind: 'indexeddb' };
  }
  try {
    const ls = localStorageStore();
    if (await works(ls)) return { store: ls, kind: 'localstorage' };
  } catch {
    // localStorage diblokir.
  }
  return { store: memoryStore(), kind: 'memory' };
}

/** Repository save lokal. Jika hanya memori yang tersedia, UI menampilkan banner. */
export async function createLocalSaveRepository(): Promise<{
  repo: LocalSaveRepository;
  kind: StorageKind;
}> {
  const { store, kind } = await detectStore();
  // Jurnal sinkron hanya berguna bila store utamanya asinkron (IndexedDB).
  let journal: SyncJournal | null = null;
  if (kind === 'indexeddb') {
    try {
      journal = localStorageJournal();
      journal.get();
    } catch {
      journal = null;
    }
  }
  return { repo: new LocalSaveRepository(store, defaultPersist, journal), kind };
}
