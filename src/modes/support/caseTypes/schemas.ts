/** Skema tipe kasus Bengkel IT tanpa React; dipakai juga oleh scripts/content-check.ts. */
import type { CaseSchemas } from '../../../content/loader.ts';
import { diagnosticCaseSchema } from './diagnostic/schema.ts';
import { hardwareCaseSchema } from './hardware/schema.ts';
import { ticketCaseSchema } from './ticket/schema.ts';

export const supportCaseSchemas: CaseSchemas = {
  ticket: ticketCaseSchema,
  diagnostic: diagnosticCaseSchema,
  hardware: hardwareCaseSchema,
};
