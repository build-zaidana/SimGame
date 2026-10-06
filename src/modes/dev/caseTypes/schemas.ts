/** Skema tipe kasus Meja Developer tanpa React; dipakai juga oleh scripts/content-check.ts. */
import type { CaseSchemas } from '../../../content/loader.ts';
import { codingCaseSchema } from './coding/schema.ts';
import { ctfCaseSchema } from './ctf/schema.ts';
import { pullRequestCaseSchema } from './pull-request/schema.ts';
import { robotCaseSchema } from './robot/schema.ts';

export const devCaseSchemas: CaseSchemas = {
  'pull-request': pullRequestCaseSchema,
  coding: codingCaseSchema,
  ctf: ctfCaseSchema,
  robot: robotCaseSchema,
};
