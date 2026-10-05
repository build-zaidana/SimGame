/** Skema tipe kasus Meja Developer tanpa React; dipakai juga oleh scripts/content-check.ts. */
import type { CaseSchemas } from '../../../content/loader.ts';
import { bugReportCaseSchema } from './bug-report/schema.ts';
import { incidentCaseSchema } from './incident/schema.ts';
import { pullRequestCaseSchema } from './pull-request/schema.ts';

export const devCaseSchemas: CaseSchemas = {
  'pull-request': pullRequestCaseSchema,
  'bug-report': bugReportCaseSchema,
  incident: incidentCaseSchema,
};
