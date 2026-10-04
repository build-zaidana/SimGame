import { t as id } from '../../../../i18n/index.ts';
import { defineCaseType } from '../../../contract.ts';
import { evaluateSupportCase } from '../../evaluate.ts';
import { personVisitor } from '../../visitors.ts';
import { TicketDocument } from './TicketDocument.tsx';
import { ticketCaseSchema } from './schema.ts';

export const ticketCaseType = defineCaseType({
  type: 'ticket',
  schema: ticketCaseSchema,
  evaluate: evaluateSupportCase,
  Document: TicketDocument,
  queueLabel: (c) => ({ icon: '🎫', title: id.support.ticket.queueTitle(c.data.subject.text) }),
  visitor: (c) =>
    personVisitor(
      c.id,
      c.data.requester.name,
      c.data.requester.department,
      id.support.visitors.ticketLines,
    ),
});
