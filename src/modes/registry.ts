import { t as id } from '../i18n/index.ts';
import type { CareerMode, UpcomingMode } from './contract.ts';
import { socMode } from './soc/index.ts';
import { supportMode } from './support/index.ts';
import { devMode } from './dev/index.ts';
import { dataMode } from './data/index.ts';

export const modes: CareerMode[] = [socMode, supportMode, devMode, dataMode];

/** Mode yang tampil di HUB sebagai "Segera hadir". Kosong: semua mode di PRD sudah bisa dimainkan. */
export const upcomingModes: UpcomingMode[] = [];

/** Judul buku panduan sebuah mode (ikut bahasa aktif). */
export function rulebookTitle(modeId: string): string {
  const m = (id.modes as Record<string, { rulebook: string } | undefined>)[modeId];
  return m?.rulebook ?? id.rulebook.heading;
}

export function getMode(modeId: string): CareerMode | undefined {
  return modes.find((m) => m.id === modeId);
}
