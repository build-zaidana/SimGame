import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateSupportCase } from '../../evaluate.ts';
import { agentVisitor } from '../../visitors.ts';
import { DiagnosticDocument } from './DiagnosticDocument.tsx';
import { diagnosticCaseSchema } from './schema.ts';

export const diagnosticCaseType = defineCaseType({
  type: 'diagnostic',
  schema: diagnosticCaseSchema,
  evaluate: evaluateSupportCase,
  Document: DiagnosticDocument,
  queueLabel: (c) => ({ icon: '📊', title: id.support.diagnostic.queueTitle(c.data.device.name) }),
  visitor: (c) => agentVisitor(c.id),
});
