import { systemVisitor } from '../../visitors.ts';
import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateSocCase } from '../../evaluate.ts';
import { LoginAlertDocument } from './LoginAlertDocument.tsx';
import { loginAlertCaseSchema } from './schema.ts';

export const loginAlertCaseType = defineCaseType({
  type: 'login-alert',
  schema: loginAlertCaseSchema,
  evaluate: evaluateSocCase,
  Document: LoginAlertDocument,
  queueLabel: (c) => ({ icon: '🔑', title: id.soc.loginAlert.queueTitle(c.data.account.user) }),
  visitor: (c) => systemVisitor(c.id),
});
