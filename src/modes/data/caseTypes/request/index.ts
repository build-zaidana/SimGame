import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateDataCase } from '../../evaluate.ts';
import { personVisitor } from '../../visitors.ts';
import { REQUEST_ICON, RequestDocument } from './RequestDocument.tsx';
import { requestCaseSchema } from './schema.ts';

export const requestCaseType = defineCaseType({
  type: 'request',
  schema: requestCaseSchema,
  evaluate: evaluateDataCase,
  Document: RequestDocument,
  decisions: ['approve', 'revise', 'escalate'],
  queueLabel: (c) => ({ icon: REQUEST_ICON[c.data.kind], title: c.data.title }),
  visitor: (c) =>
    personVisitor(
      c.id,
      c.data.from.name,
      c.data.from.team,
      c.data.kind.startsWith('ai') ? id.data.visitors.aiLines : id.data.visitors.requestLines,
    ),
});
