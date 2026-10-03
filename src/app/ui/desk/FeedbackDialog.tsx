import { id } from '../../../i18n/id.ts';
import { trustDelta } from '../../../engine/economy.ts';
import type { BaseCase, Rule } from '../../../content/schemas.ts';
import type { SessionCase } from '../../../engine/types.ts';
import { Dialog } from '../Dialog.tsx';
import { btnPrimary } from '../styles.ts';
import { evidenceText } from './format.ts';

interface FeedbackDialogProps {
  caseData: BaseCase;
  sessionCase: SessionCase;
  rules: Rule[];
  decisionLabel(id: string): string;
  onContinue(): void;
}

/** Umpan balik langsung: benar/salah + alasan singkat + aturan terkait. */
export function FeedbackDialog({
  caseData,
  sessionCase,
  rules,
  decisionLabel,
  onContinue,
}: FeedbackDialogProps) {
  const o = sessionCase.outcome;
  if (!o) return null;
  const full = o.correct && o.missedEvidence.length === 0 && o.wrongMarks.length === 0;
  const verdict = full ? 'correct' : o.decisionScore > 0 ? 'partial' : 'wrong';
  const icon = { correct: '✓', partial: '≈', wrong: '✗' }[verdict];
  const color = { correct: 'text-safe', partial: 'text-accent', wrong: 'text-danger' }[verdict];
  const delta = trustDelta(o.impact, o.severity);
  const label = (ev: string) => evidenceText(caseData.data, ev) ?? ev;

  return (
    <Dialog labelledBy="feedback-title" onClose={onContinue} initialFocus="content">
      <p className="float-right ml-2" aria-hidden="true">
        <span className={`stamp border-4 px-2 py-1 font-display text-lg ${color} border-current`}>
          {id.stamps[o.decision] ?? o.decision.toUpperCase()}
        </span>
      </p>
      <h2 id="feedback-title" className={`font-display text-xl ${color}`}>
        <span aria-hidden="true">{icon} </span>
        {id.feedback[verdict]}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        {id.feedback.score(sessionCase.score ?? 0)}
        {delta !== 0 && ` · ${id.feedback.trustChange(delta)}`}
      </p>
      <p className="mt-3">{id.feedback.yourDecision(decisionLabel(o.decision))}</p>
      {!o.correct && <p>{id.feedback.correctDecision(decisionLabel(caseData.correctDecision))}</p>}
      <p className="mt-3">{caseData.explanation}</p>
      {o.missedEvidence.length > 0 && (
        <div className="mt-3">
          <p className="font-display text-sm">{id.feedback.missedEvidence}</p>
          <ul className="list-disc pl-5 text-sm">
            {o.missedEvidence.map((ev) => (
              <li key={ev}>{label(ev)}</li>
            ))}
          </ul>
        </div>
      )}
      {o.wrongMarks.length > 0 && (
        <div className="mt-3">
          <p className="font-display text-sm">{id.feedback.wrongMarks}</p>
          <ul className="list-disc pl-5 text-sm">
            {o.wrongMarks.map((ev) => (
              <li key={ev}>{label(ev)}</li>
            ))}
          </ul>
        </div>
      )}
      {rules.length > 0 && (
        <div className="mt-3">
          <p className="font-display text-sm">{id.feedback.rules}</p>
          <ul className="list-disc pl-5 text-sm">
            {rules.map((r) => (
              <li key={r.id}>{r.text}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button type="button" className={btnPrimary} onClick={onContinue}>
          {id.feedback.continue}
        </button>
      </div>
    </Dialog>
  );
}
