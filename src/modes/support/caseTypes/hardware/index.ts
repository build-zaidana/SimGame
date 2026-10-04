import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateSupportCase } from '../../evaluate.ts';
import { personVisitor } from '../../visitors.ts';
import { HardwareDocument } from './HardwareDocument.tsx';
import { hardwareCaseSchema } from './schema.ts';

export const hardwareCaseType = defineCaseType({
  type: 'hardware',
  schema: hardwareCaseSchema,
  evaluate: evaluateSupportCase,
  Document: HardwareDocument,
  queueLabel: (c) => ({ icon: '🔧', title: id.support.hardware.queueTitle(c.data.device.name) }),
  visitor: (c) => personVisitor(c.id, c.data.device.owner, '', id.support.visitors.hardwareLines),
});
