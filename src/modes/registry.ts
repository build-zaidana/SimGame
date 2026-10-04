import { t as id } from '../i18n/index.ts';
import type { CareerMode, UpcomingMode } from './contract.ts';
import { socMode } from './soc/index.ts';
import { supportMode } from './support/index.ts';

export const modes: CareerMode[] = [socMode, supportMode];

export const upcomingModes: UpcomingMode[] = (['dev', 'data'] as const).map((m) => ({
  id: m,
  get title() {
    return id.modes[m].title;
  },
  get deskTitle() {
    return id.modes[m].deskTitle;
  },
  status: 'coming-soon',
}));

/** Judul buku panduan sebuah mode (ikut bahasa aktif). */
export function rulebookTitle(modeId: string): string {
  const m = (id.modes as Record<string, { rulebook: string } | undefined>)[modeId];
  return m?.rulebook ?? id.rulebook.heading;
}

export function getMode(modeId: string): CareerMode | undefined {
  return modes.find((m) => m.id === modeId);
}
