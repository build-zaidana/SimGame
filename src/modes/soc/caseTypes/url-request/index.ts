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
});
