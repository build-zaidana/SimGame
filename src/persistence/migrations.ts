import { SAVE_SCHEMA_VERSION, saveDataSchema, type SaveData } from './saveSchema.ts';

export type SaveErrorCode =
  'not-object' | 'no-version' | 'newer-version' | 'missing-migration' | 'invalid';

export class SaveFormatError extends Error {
  readonly code: SaveErrorCode;
  constructor(code: SaveErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = 'SaveFormatError';
    this.code = code;
  }
}

type RawSave = Record<string, unknown>;
export type Migration = (data: RawSave) => RawSave;

/** Kunci = versi asal. Setiap langkah wajib punya test di persistence.test.ts. */
export const MIGRATIONS: Record<number, Migration> = {
  /** v1 → v2: sesi aktif menyimpan kasus prosedural (`generatedCases`). */
  1: (d) => {
    const modes = (d['modes'] ?? {}) as Record<string, Record<string, unknown>>;
    const next: Record<string, unknown> = {};
    for (const [id, progress] of Object.entries(modes)) {
      const session = progress['activeSession'] as Record<string, unknown> | undefined;
      next[id] = session
        ? { ...progress, activeSession: { generatedCases: {}, ...session } }
        : progress;
    }
    return { ...d, modes: next };
  },
  /** v2 → v3: slot `practiceSession` (opsional) ditambahkan; data lama tidak perlu diubah. */
  2: (d) => d,
  /** v3 → v4: setiap progres mode mendapat peta lencana kosong (PRD C3). */
  3: (d) => {
    const modes = (d['modes'] ?? {}) as Record<string, Record<string, unknown>>;
    const next: Record<string, unknown> = {};
    for (const [id, progress] of Object.entries(modes)) next[id] = { badges: {}, ...progress };
    return { ...d, modes: next };
  },
  /** v4 → v5: pengaturan `music`; ikut pilihan efek suara yang sudah ada. */
  4: (d) => {
    const profile = (d['profile'] ?? {}) as Record<string, unknown>;
    const settings = (profile['settings'] ?? {}) as Record<string, unknown>;
    return {
      ...d,
      profile: { ...profile, settings: { music: settings['sound'] !== false, ...settings } },
    };
  },
  /** v5 → v6: pengaturan bahasa; save lama tetap Bahasa Indonesia. */
  5: (d) => {
    const profile = (d['profile'] ?? {}) as Record<string, unknown>;
    const settings = (profile['settings'] ?? {}) as Record<string, unknown>;
    return { ...d, profile: { ...profile, settings: { language: 'id', ...settings } } };
  },
  /** v6 → v7: kantor yang bisa dijelajahi menyala untuk semua pemain (bisa dimatikan). */
  6: (d) => {
    const profile = (d['profile'] ?? {}) as Record<string, unknown>;
    const settings = (profile['settings'] ?? {}) as Record<string, unknown>;
    return { ...d, profile: { ...profile, settings: { exploreOffice: true, ...settings } } };
  },
  /** v7 → v8: verdict kasus diperluas untuk mode IT Support; data lama tetap valid. */
  7: (d) => d,
  /** v8 → v9: kasus boleh menyimpan jawaban ketikan (Meja Developer); data lama tetap valid. */
  8: (d) => d,
  /** v9 → v10: jawaban boleh menyimpan waktu rollback darurat; data lama tetap valid. */
  9: (d) => d,
};

export function runMigrations(
  raw: unknown,
  migrations: Record<number, Migration>,
  target: number,
): RawSave {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new SaveFormatError('not-object', 'save harus berupa objek');
  }
  let data = raw as RawSave;
  let version = data['schemaVersion'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new SaveFormatError('no-version', 'schemaVersion tidak ada');
  }
  if (version > target) {
    throw new SaveFormatError(
      'newer-version',
      `save v${version} lebih baru dari game (v${target})`,
    );
  }
  while (version < target) {
    const step = migrations[version];
    if (!step) throw new SaveFormatError('missing-migration', `tidak ada migrasi dari v${version}`);
    data = { ...step(data), schemaVersion: version + 1 };
    version += 1;
  }
  return data;
}

/** Migrasi berurutan lalu validasi zod. Dipakai saat load dan saat impor. */
export function migrate(raw: unknown): SaveData {
  const data = runMigrations(raw, MIGRATIONS, SAVE_SCHEMA_VERSION);
  const parsed = saveDataSchema.safeParse(data);
  if (!parsed.success) {
    throw new SaveFormatError(
      'invalid',
      parsed.error.issues.map((i) => i.path.join('.')).join(', '),
    );
  }
  return parsed.data;
}
