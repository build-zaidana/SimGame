import type { SaveData } from './saveSchema.ts';

/** Satu-satunya pintu ke penyimpanan. v1.1: SyncedSaveRepository membungkus implementasi lokal. */
export interface SaveRepository {
  /** null jika belum ada save; melempar SaveFormatError jika save rusak. */
  load(): Promise<SaveData | null>;
  /** Menulis save baru; save lama digeser ke slot cadangan. */
  save(data: SaveData): Promise<void>;
  loadBackup(): Promise<SaveData | null>;
  clear(): Promise<void>;
}

export type StorageKind = 'indexeddb' | 'localstorage' | 'memory';
