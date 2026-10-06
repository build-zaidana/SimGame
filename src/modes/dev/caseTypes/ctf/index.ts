import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateFlag } from '../../evaluate.ts';
import { ctfVisitor } from '../../visitors.ts';
import { CtfDocument } from './CtfDocument.tsx';
import { ctfCaseSchema } from './schema.ts';

export const ctfCaseType = defineCaseType({
  type: 'ctf',
  schema: ctfCaseSchema,
  evaluate: (c, input) => evaluateFlag(c, c.data.flag, input),
  Document: CtfDocument,
  decisions: ['submit'],
  ready: (_c, answer) => (answer?.text ?? '').trim() !== '',
  queueLabel: (c) => ({ icon: '🚩', title: id.dev.ctf.queueTitle(c.data.title) }),
  visitor: (c) => ctfVisitor(c.id),
});
