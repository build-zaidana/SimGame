/** Generator kasus SOC (tanpa React; dipakai juga oleh scripts/content-check.ts). */
import type { CaseGenerator } from '../../contract.ts';
import { typosquatDomain } from './typosquat-domain.ts';

export const socGenerators: Record<string, CaseGenerator> = {
  'typosquat-domain': typosquatDomain,
};
