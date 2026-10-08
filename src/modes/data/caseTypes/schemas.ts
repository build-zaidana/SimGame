/** Skema tipe kasus Meja Data tanpa React; dipakai juga oleh scripts/content-check.ts. */
import type { CaseSchemas } from '../../../content/loader.ts';
import { chartCaseSchema } from './chart/schema.ts';
import { queryCaseSchema } from './query/schema.ts';
import { requestCaseSchema } from './request/schema.ts';

export const dataCaseSchemas: CaseSchemas = {
  query: queryCaseSchema,
  chart: chartCaseSchema,
  request: requestCaseSchema,
};
