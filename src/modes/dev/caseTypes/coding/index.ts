import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateCodingCase } from '../../evaluate.ts';
import { evaluateIncident } from '../../incident.ts';
import { personVisitor } from '../../visitors.ts';
import { CodingDocument } from './CodingDocument.tsx';
import { codingCaseSchema } from './schema.ts';

export const codingCaseType = defineCaseType({
  type: 'coding',
  schema: codingCaseSchema,
  evaluate: (c, input) =>
    c.data.incident
      ? evaluateIncident(c, c.data.incident.drainPerSecond, input)
      : evaluateCodingCase(c, input),
  Document: CodingDocument,
  decisions: ['submit'],
  // Kirim hanya setelah tes dijalankan untuk kode yang sekarang ada di editor.
  ready: (_c, answer) => answer?.total !== undefined,
  queueLabel: (c) => ({
    icon: c.data.task === 'fix' ? '🐞' : '🧩',
    title: id.dev.coding.queueTitle(c.data.title),
  }),
  visitor: (c) =>
    personVisitor(c.id, c.data.requester.name, c.data.requester.team, id.dev.visitors.taskLines),
});
