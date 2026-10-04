import { lazy } from 'react';
import { t as id } from '../../i18n/index.ts';
import type { CareerMode } from '../contract.ts';
import { diagnosticCaseType } from './caseTypes/diagnostic/index.ts';
import { hardwareCaseType } from './caseTypes/hardware/index.ts';
import { ticketCaseType } from './caseTypes/ticket/index.ts';

export const supportMode: CareerMode = {
  id: 'support',
  get title() {
    return id.modes.support.title;
  },
  get deskTitle() {
    return id.modes.support.deskTitle;
  },
  status: 'available',
  mentor: 'joko',
  get decisions() {
    return [
      { id: 'guide', label: id.decisions['guide'] ?? 'guide', unlockedAtShift: 1 },
      { id: 'fix', label: id.decisions['fix'] ?? 'fix', unlockedAtShift: 1 },
      { id: 'escalate', label: id.decisions['escalate'] ?? 'escalate', unlockedAtShift: 1 },
      // Ganti komponen terbuka bersama konsep hardware-basics (shift 2).
      { id: 'replace', label: id.decisions['replace'] ?? 'replace', unlockedAtShift: 2 },
    ];
  },
  get citations() {
    return id.support.citations;
  },
  caseTypes: [ticketCaseType, diagnosticCaseType, hardwareCaseType],
  Desk: lazy(() => import('./desk/SupportDesk.tsx')),
  contentRoot: 'modes/support',
  loadContent: (locale) => import('./support-content.ts').then((m) => m.loadSupportContent(locale)),
};
