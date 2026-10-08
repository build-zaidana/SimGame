import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateDataCase } from '../../evaluate.ts';
import { personVisitor } from '../../visitors.ts';
import { ChartDocument } from './ChartDocument.tsx';
import { chartCaseSchema } from './schema.ts';

export const chartCaseType = defineCaseType({
  type: 'chart',
  schema: chartCaseSchema,
  evaluate: evaluateDataCase,
  Document: ChartDocument,
  decisions: ['approve', 'revise', 'escalate'],
  queueLabel: (c) => ({ icon: '📊', title: id.data.chart.queueTitle(c.data.title) }),
  visitor: (c) =>
    personVisitor(c.id, c.data.author.name, c.data.author.team, id.data.visitors.chartLines),
});
