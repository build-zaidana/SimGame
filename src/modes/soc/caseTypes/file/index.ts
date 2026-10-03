import { staffVisitor } from '../../visitors.ts';
import { id } from '../../../../i18n/id.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateSocCase } from '../../evaluate.ts';
import { FileDocument } from './FileDocument.tsx';
import { fileCaseSchema } from './schema.ts';

export const fileCaseType = defineCaseType({
  type: 'file',
  schema: fileCaseSchema,
  evaluate: evaluateSocCase,
  Document: FileDocument,
  queueLabel: (c) => ({ icon: '📄', title: c.data.fileName.text }),
  visitor: (c) => staffVisitor(c.id, id.soc.visitors.fileLines),
});
