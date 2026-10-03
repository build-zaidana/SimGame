/** Skema tipe kasus SOC tanpa komponen React; dipakai juga oleh scripts/content-check.ts. */
import type { CaseSchemas } from '../../../content/loader.ts';
import { emailCaseSchema } from './email/schema.ts';
import { urlRequestCaseSchema } from './url-request/schema.ts';

export const socCaseSchemas: CaseSchemas = {
  email: emailCaseSchema,
  'url-request': urlRequestCaseSchema,
};
