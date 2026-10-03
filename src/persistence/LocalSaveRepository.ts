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

export class LocalSaveRepository implements SaveRepository {
  private readonly store: KeyValueStore;
  private readonly persist: () => Promise<unknown>;
  private persistRequested = false;

  constructor(store: KeyValueStore, persist: () => Promise<unknown> = defaultPersist) {
    this.store = store;
    this.persist = persist;
  }

  async load(): Promise<SaveData | null> {
    const raw = await this.store.get(SAVE_KEY);
    return raw === undefined ? null : migrate(raw);
  }

  async loadBackup(): Promise<SaveData | null> {
    const raw = await this.store.get(BACKUP_KEY);
    if (raw === undefined) return null;
    try {
      return migrate(raw);
    } catch {
      return null;
    }
  }

  async save(data: SaveData): Promise<void> {
    if (!this.persistRequested) {
      this.persistRequested = true;
      void this.persist();
    }
    const previous = await this.store.get(SAVE_KEY);
    if (previous !== undefined) await this.store.set(BACKUP_KEY, previous);
    await this.store.set(SAVE_KEY, data);
  }

  async clear(): Promise<void> {
    await this.store.del(SAVE_KEY);
    await this.store.del(BACKUP_KEY);
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
  return { repo: new LocalSaveRepository(store), kind };
}
