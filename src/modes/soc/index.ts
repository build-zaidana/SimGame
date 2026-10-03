import { lazy } from 'react';
import { id } from '../../i18n/id.ts';
import type { CareerMode } from '../contract.ts';
import { emailCaseType } from './caseTypes/email/index.ts';
import { fileCaseType } from './caseTypes/file/index.ts';
import { loginAlertCaseType } from './caseTypes/login-alert/index.ts';
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
    // PRD §5.2: aksi lanjutan terbuka bertahap. Reset password bersama konsep passwords-mfa.
    { id: 'reset-password', label: id.decisions['reset-password'] ?? 'reset', unlockedAtShift: 3 },
  ],
  caseTypes: [emailCaseType, urlRequestCaseType, loginAlertCaseType, fileCaseType],
  Desk: lazy(() => import('./desk/SocDesk.tsx')),
  contentRoot: 'modes/soc',
  loadContent: () => import('./content.ts').then((m) => m.loadSocContent()),
};
