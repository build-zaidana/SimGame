import { defineCaseType } from '../../../contract.ts';
import { evaluateSocCase } from '../../evaluate.ts';
import { EmailDocument } from './EmailDocument.tsx';
import { emailCaseSchema } from './schema.ts';

export const emailCaseType = defineCaseType({
  type: 'email',
  schema: emailCaseSchema,
  evaluate: evaluateSocCase,
  Document: EmailDocument,
  queueLabel: (c) => ({ icon: '✉', title: c.data.subject.text }),
});
