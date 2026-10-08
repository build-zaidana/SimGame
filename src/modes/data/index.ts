import { lazy } from 'react';
import { t as id } from '../../i18n/index.ts';
import type { CareerMode } from '../contract.ts';
import { chartCaseType } from './caseTypes/chart/index.ts';
import { queryCaseType } from './caseTypes/query/index.ts';
import { requestCaseType } from './caseTypes/request/index.ts';

export const dataMode: CareerMode = {
  id: 'data',
  get title() {
    return id.modes.data.title;
  },
  get deskTitle() {
    return id.modes.data.deskTitle;
  },
  status: 'available',
  mentor: 'laras',
  get decisions() {
    return [
      { id: 'submit', label: id.decisions['submit'] ?? 'submit', unlockedAtShift: 1 },
      { id: 'approve', label: id.decisions['approve'] ?? 'approve', unlockedAtShift: 1 },
      { id: 'revise', label: id.decisions['revise'] ?? 'revise', unlockedAtShift: 1 },
      { id: 'escalate', label: id.decisions['escalate'] ?? 'escalate', unlockedAtShift: 1 },
    ];
  },
  get citations() {
    return id.data.citations;
  },
  caseTypes: [queryCaseType, chartCaseType, requestCaseType],
  Desk: lazy(() => import('./desk/DataDesk.tsx')),
  contentRoot: 'modes/data',
  loadContent: (locale) => import('./data-content.ts').then((m) => m.loadDataContent(locale)),
};
