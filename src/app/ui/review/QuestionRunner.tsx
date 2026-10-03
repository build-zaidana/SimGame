import { useState, type ReactNode } from 'react';
import type { ReviewItem } from '../../../content/schemas.ts';
import { createRng } from '../../../engine/rng.ts';
import {
  gradeMcq,
  gradeOrderSteps,
  gradeTapEvidence,
  shuffledOrder,
} from '../../../engine/review.ts';
import { id } from '../../../i18n/id.ts';
import { Evidence } from '../Evidence.tsx';
import { btn, btnPrimary, btnSecondary, panel } from '../styles.ts';

export interface QuestionResult {
  itemId: string;
  correct: boolean;
}

type Item<T extends ReviewItem['type']> = Extract<ReviewItem, { type: T }>;

interface ItemProps<T extends ReviewItem['type']> {
  item: Item<T>;
  checked: boolean;
  onCheck(correct: boolean): void;
}

function CheckButton({ disabled, onClick }: { disabled: boolean; onClick(): void }) {
  return (
    <button type="button" className={btnPrimary} disabled={disabled} onClick={onClick}>
      {id.review.check}
    </button>
  );
}

function McqItem({ item, checked, onCheck }: ItemProps<'mcq'>) {
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {item.choices.map((c, i) => {
        const isAnswer = checked && i === item.answerIndex;
        return (
          <button
            key={i}
            type="button"
            aria-pressed={chosen === i}
            disabled={checked}
            onClick={() => setChosen(i)}
            className={
              `${btn} justify-start text-left font-body ` +
              (chosen === i ? 'border-accent bg-accent/20 ' : 'bg-bg ') +
              (isAnswer ? 'border-safe' : '')
            }
          >
            <span aria-hidden="true">{isAnswer ? '✓' : chosen === i ? '●' : '○'}</span>
            {c}
          </button>
        );
      })}
      {!checked && (
        <CheckButton
          disabled={chosen === null}
          onClick={() => onCheck(gradeMcq(item.answerIndex, chosen ?? -1))}
        />
      )}
      {checked && (
        <p className="text-sm">{id.review.answerWas(item.choices[item.answerIndex] ?? '')}</p>
      )}
    </div>
  );
}

function TapItem({ item, checked, onCheck }: ItemProps<'tap-evidence'>) {
  const [marks, setMarks] = useState<string[]>([]);
  const toggle = (ev: string) =>
    setMarks((m) => (m.includes(ev) ? m.filter((x) => x !== ev) : [...m, ev]));
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-muted">{id.review.tapHint}</p>
      <div className={`${panel} bg-bg p-2`}>
        {item.parts.map((p, i) => (
          <Evidence
            key={i}
            evidenceId={p.evidenceId}
            marked={p.evidenceId ? marks.includes(p.evidenceId) : false}
            locked={checked}
            onToggle={toggle}
          >
            {p.text}
            {checked && p.evidenceId && item.answer.includes(p.evidenceId) && (
              <span className="ml-1 text-safe">
                <span aria-hidden="true">✓</span>
                <span className="sr-only">(bukti)</span>
              </span>
            )}
          </Evidence>
        ))}
      </div>
      {!checked && (
        <CheckButton
          disabled={marks.length === 0}
          onClick={() => onCheck(gradeTapEvidence(item.answer, marks))}
        />
      )}
    </div>
  );
}

function OrderItem({ item, checked, onCheck, seed }: ItemProps<'order-steps'> & { seed: number }) {
  const [order, setOrder] = useState(() => shuffledOrder(item.steps.length, createRng(seed)));
  const move = (pos: number, delta: number) =>
    setOrder((o) => {
      const next = [...o];
      const target = pos + delta;
      if (target < 0 || target >= next.length) return o;
      [next[pos], next[target]] = [next[target] as number, next[pos] as number];
      return next;
    });
  const shown = checked ? item.steps.map((_, i) => i) : order;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-muted">{id.review.orderHint}</p>
      <ol className="flex flex-col gap-2" data-testid="order-list">
        {shown.map((stepIndex, pos) => {
          const step = item.steps[stepIndex] ?? '';
          return (
            <li key={stepIndex} className={`${panel} flex items-center gap-2 bg-bg p-2`}>
              <span className="font-display text-accent">{pos + 1}.</span>
              <span className="flex-1">{step}</span>
              {!checked && (
                <>
                  <button
                    type="button"
                    className={btnSecondary}
                    aria-label={id.review.moveUp(step)}
                    disabled={pos === 0}
                    onClick={() => move(pos, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={btnSecondary}
                    aria-label={id.review.moveDown(step)}
                    disabled={pos === shown.length - 1}
                    onClick={() => move(pos, 1)}
                  >
                    ↓
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ol>
      {!checked && <CheckButton disabled={false} onClick={() => onCheck(gradeOrderSteps(order))} />}
    </div>
  );
}

interface QuestionRunnerProps {
  items: readonly ReviewItem[];
  /** Seed untuk urutan acak soal order-steps. */
  seed: number;
  intro: string;
  onAnswer?(r: QuestionResult): void;
  /** Ditampilkan setelah soal terakhir; menerima semua jawaban. */
  renderDone(results: QuestionResult[]): ReactNode;
}

/** Menjalankan serangkaian soal satu per satu: jawab → Periksa → penjelasan → soal berikutnya. */
export function QuestionRunner({ items, seed, intro, onAnswer, renderDone }: QuestionRunnerProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const item = items[index];
  const current = item ? results.find((r) => r.itemId === item.id) : undefined;

  if (!item) return <>{renderDone(results)}</>;

  const onCheck = (correct: boolean) => {
    const r = { itemId: item.id, correct };
    onAnswer?.(r);
    setResults((rs) => [...rs, r]);
  };

  return (
    <section
      className="flex flex-col gap-3"
      data-review-item={item.id}
      aria-labelledby="review-prompt"
    >
      <p className="text-sm text-ink-muted">
        {index === 0 && `${intro} `}
        {id.review.progress(index + 1, items.length)}
      </p>
      <h2 id="review-prompt" className="text-lg font-bold">
        {item.prompt}
      </h2>
      {item.type === 'mcq' && (
        <McqItem key={item.id} item={item} checked={!!current} onCheck={onCheck} />
      )}
      {item.type === 'tap-evidence' && (
        <TapItem key={item.id} item={item} checked={!!current} onCheck={onCheck} />
      )}
      {item.type === 'order-steps' && (
        <OrderItem
          key={item.id}
          item={item}
          checked={!!current}
          onCheck={onCheck}
          seed={seed + index}
        />
      )}
      {current && (
        <div role="status" className={`${panel} p-3`}>
          <p className={`font-display text-lg ${current.correct ? 'text-safe' : 'text-danger'}`}>
            <span aria-hidden="true">{current.correct ? '✓ ' : '✗ '}</span>
            {current.correct ? id.review.correct : id.review.wrong}
          </p>
          <p className="mt-1">{item.explanation}</p>
          <button
            type="button"
            className={`${btnPrimary} mt-3 w-full`}
            onClick={() => setIndex(index + 1)}
          >
            {id.review.next}
          </button>
        </div>
      )}
    </section>
  );
}
