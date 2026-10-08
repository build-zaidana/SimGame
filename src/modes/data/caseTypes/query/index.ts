import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateQueryCase } from '../../evaluate.ts';
import { personVisitor } from '../../visitors.ts';
import { QueryDocument } from './QueryDocument.tsx';
import { queryCaseSchema } from './schema.ts';

export const queryCaseType = defineCaseType({
  type: 'query',
  schema: queryCaseSchema,
  evaluate: evaluateQueryCase,
  Document: QueryDocument,
  decisions: ['submit'],
  // Kirim hanya setelah query dijalankan untuk teks yang sekarang ada di editor.
  ready: (_c, answer) => answer?.total !== undefined,
  queueLabel: (c) => ({
    icon: c.data.task === 'fix' ? '🐞' : '🗃',
    title: id.data.query.queueTitle(c.data.title),
  }),
  visitor: (c) =>
    personVisitor(
      c.id,
      c.data.requester.name,
      c.data.requester.team,
      c.data.task === 'fix' ? id.data.visitors.fixLines : id.data.visitors.queryLines,
    ),
});
