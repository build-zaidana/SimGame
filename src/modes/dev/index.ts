import { lazy } from 'react';
import { t as id } from '../../i18n/index.ts';
import type { CareerMode } from '../contract.ts';
import { codingCaseType } from './caseTypes/coding/index.ts';
import { ctfCaseType } from './caseTypes/ctf/index.ts';
import { pullRequestCaseType } from './caseTypes/pull-request/index.ts';

export const devMode: CareerMode = {
  id: 'dev',
  get title() {
    return id.modes.dev.title;
  },
  get deskTitle() {
    return id.modes.dev.deskTitle;
  },
  status: 'available',
  mentor: 'dimas',
  get decisions() {
    return [
      { id: 'submit', label: id.decisions['submit'] ?? 'submit', unlockedAtShift: 1 },
      { id: 'approve', label: id.decisions['approve'] ?? 'approve', unlockedAtShift: 1 },
      { id: 'revise', label: id.decisions['revise'] ?? 'revise', unlockedAtShift: 1 },
      { id: 'escalate', label: id.decisions['escalate'] ?? 'escalate', unlockedAtShift: 1 },
      // Rollback terbuka bersama bab rilis & version control (shift 3).
      { id: 'rollback', label: id.decisions['rollback'] ?? 'rollback', unlockedAtShift: 3 },
    ];
  },
  get citations() {
    return id.dev.citations;
  },
  caseTypes: [codingCaseType, pullRequestCaseType, ctfCaseType],
  Desk: lazy(() => import('./desk/DevDesk.tsx')),
  contentRoot: 'modes/dev',
  loadContent: (locale) => import('./dev-content.ts').then((m) => m.loadDevContent(locale)),
};
