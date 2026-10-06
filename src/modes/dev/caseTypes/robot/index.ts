import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateCodingCase } from '../../evaluate.ts';
import { personVisitor } from '../../visitors.ts';
import { RobotDocument } from './RobotDocument.tsx';
import { robotCaseSchema } from './schema.ts';

export const robotCaseType = defineCaseType({
  type: 'robot',
  schema: robotCaseSchema,
  // Tiap peta dihitung seperti satu tes: nilai = bagian peta yang berhasil.
  evaluate: evaluateCodingCase,
  Document: RobotDocument,
  decisions: ['submit'],
  ready: (_c, answer) => answer?.total !== undefined,
  queueLabel: (c) => ({ icon: '🤖', title: id.dev.robot.queueTitle(c.data.title) }),
  visitor: (c) =>
    personVisitor(c.id, c.data.requester.name, c.data.requester.team, id.dev.visitors.taskLines),
});
