import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateDevCase } from '../../evaluate.ts';
import { personVisitor } from '../../visitors.ts';
import { PullRequestDocument } from './PullRequestDocument.tsx';
import { pullRequestCaseSchema } from './schema.ts';

export const pullRequestCaseType = defineCaseType({
  type: 'pull-request',
  schema: pullRequestCaseSchema,
  evaluate: evaluateDevCase,
  Document: PullRequestDocument,
  decisions: ['approve', 'revise', 'escalate', 'rollback'],
  queueLabel: (c) => ({ icon: '🔀', title: id.dev.pr.queueTitle(c.data.title) }),
  visitor: (c) =>
    personVisitor(c.id, c.data.author.name, c.data.author.team, id.dev.visitors.prLines),
});
