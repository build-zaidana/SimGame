import { id } from '../i18n/id.ts';
import type { CareerMode, UpcomingMode } from './contract.ts';
import { socMode } from './soc/index.ts';

export const modes: CareerMode[] = [socMode];

export const upcomingModes: UpcomingMode[] = (['support', 'dev', 'data'] as const).map((m) => ({
  id: m,
  ...id.modes[m],
  status: 'coming-soon',
}));

export function getMode(modeId: string): CareerMode | undefined {
  return modes.find((m) => m.id === modeId);
}
