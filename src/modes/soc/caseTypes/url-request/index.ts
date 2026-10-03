import { staffVisitor } from '../../visitors.ts';
import { id } from '../../../../i18n/id.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateSocCase } from '../../evaluate.ts';
import { urlRequestCaseSchema } from './schema.ts';
import { UrlRequestDocument } from './UrlRequestDocument.tsx';

export const urlRequestCaseType = defineCaseType({
  type: 'url-request',
  schema: urlRequestCaseSchema,
  evaluate: evaluateSocCase,
  Document: UrlRequestDocument,
  queueLabel: (c) => ({ icon: '🔗', title: id.soc.urlRequest.queueTitle(c.data.requester.name) }),
  visitor: (c) => ({
    name: c.data.requester.name,
    role: c.data.requester.department,
    kind: 'person',
    line: staffVisitor(c.id, id.soc.visitors.urlLines).line,
  }),
});
