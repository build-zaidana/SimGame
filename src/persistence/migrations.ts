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

/** Kunci = versi asal. Contoh nanti: `1: (d) => ({ ...d, newField: … })` untuk v1 → v2. */
export const MIGRATIONS: Record<number, Migration> = {};

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
