import { lazy } from 'react';
import { id } from '../../i18n/id.ts';
import type { CareerMode } from '../contract.ts';
import { emailCaseType } from './caseTypes/email/index.ts';
import { urlRequestCaseType } from './caseTypes/url-request/index.ts';

export const socMode: CareerMode = {
  id: 'soc',
  title: id.modes.soc.title,
  deskTitle: id.modes.soc.deskTitle,
  status: 'available',
  decisions: [
    { id: 'allow', label: id.decisions['allow'] ?? 'allow', unlockedAtShift: 1 },
    { id: 'block', label: id.decisions['block'] ?? 'block', unlockedAtShift: 1 },
    { id: 'escalate', label: id.decisions['escalate'] ?? 'escalate', unlockedAtShift: 1 },
  ],
  caseTypes: [emailCaseType, urlRequestCaseType],
  Desk: lazy(() => import('./desk/SocDesk.tsx')),
  contentRoot: 'modes/soc',
  loadContent: () => import('./content.ts').then((m) => m.loadSocContent()),
};
