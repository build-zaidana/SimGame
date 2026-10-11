import { useState } from 'react';
import type { ProjectDef } from '../../content/schemas.ts';
import { canAdd, remainingCards, scoreBrief, type BriefKind } from '../../engine/project.ts';
import { t as id } from '../../i18n/index.ts';
import { getMode } from '../../modes/registry.ts';
import { engineCards, projectProgressOf, projectStep } from '../projects.ts';
import { useAppStore } from '../store.ts';
import { btnPrimary, btnSecondary, panel } from '../ui/styles.ts';

const KINDS: readonly BriefKind[] = ['clear', 'ambiguous', 'out-of-scope'];
const PRIORITY_CLASS: Record<string, string> = {
  must: 'border-danger text-danger',
  should: 'border-accent text-accent',
  could: 'border-ink/50 text-ink-muted',
};
const pct = (x: number) => Math.round(x * 100);

/** Proyek klien (ADR 032): brief → rencana sprint → sprint di meja → retro → … → selesai. */
export function ProjectScreen() {
  const focus = useAppStore((s) => s.projectFocus);
  const contents = useAppStore((s) => s.contents);
  const save = useAppStore((s) => s.save);
  const lastSprint = useAppStore((s) => s.lastSprint);
  const goTo = useAppStore((s) => s.goTo);
  const content = focus ? contents[focus.modeId] : undefined;
  const project = content?.projects.find((p) => p.id === focus?.projectId);
  const mode = focus ? getMode(focus.modeId) : undefined;
  if (!focus || !project || !mode) return null;
  const modeProgress = save?.modes[focus.modeId];
  const step = projectStep(project, modeProgress);
  const progress = projectProgressOf(modeProgress, project.id);
  const retro = lastSprint?.projectId === project.id ? lastSprint : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 p-4 pb-36">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnSecondary} onClick={() => goTo('hub')}>
          {id.project.back}
        </button>
        <p className="text-sm text-ink-muted">{mode.deskTitle}</p>
      </div>
      <header>
        <h1 className="font-display text-2xl text-accent">
          <span aria-hidden="true">📋 </span>
          {project.title}
        </h1>
        <p className="text-sm text-ink-muted">
          {id.project.client}: {project.client.name} · {project.client.team}
        </p>
      </header>
      <Steps project={project} current={step} />
      {retro && (
        <Retro
          project={project}
          sprint={progress.sprintsDone}
          outcome={retro.outcome}
          pay={retro.pay}
          planScore={progress.planScores[progress.planScores.length - 1] ?? 0}
        />
      )}
      {step.kind === 'brief' && <Brief project={project} />}
      {step.kind === 'planning' && <Plan project={project} sprint={step.sprint} />}
      {step.kind === 'done' && <Complete project={project} />}
    </main>
  );
}

function Steps({
  project,
  current,
}: {
  project: ProjectDef;
  current: ReturnType<typeof projectStep>;
}) {
  const at =
    current.kind === 'brief'
      ? 0
      : current.kind === 'planning'
        ? current.sprint
        : project.sprints.length + 1;
  const labels = [
    id.project.status.brief,
    ...project.sprints.map((_, i) => `${project.terms.sprint} ${i + 1}`),
  ];
  return (
    <ol className="flex flex-wrap gap-1 text-xs" aria-label={id.project.hubHeading}>
      {labels.map((l, i) => (
        <li
          key={i}
          aria-current={i === at ? 'step' : undefined}
          className={
            'border-2 px-2 py-1 ' +
            (i < at
              ? 'border-safe text-safe'
              : i === at
                ? 'border-accent text-accent'
                : 'border-ink/30 text-ink-muted')
          }
        >
          <span aria-hidden="true">{i < at ? '✓ ' : ''}</span>
          {l}
        </li>
      ))}
    </ol>
  );
}

function Brief({ project }: { project: ProjectDef }) {
  const submitBrief = useAppStore((s) => s.submitBrief);
  const [answers, setAnswers] = useState<Record<string, BriefKind>>({});
  const [checked, setChecked] = useState(false);
  const t = id.project.brief;
  const items = project.brief.items;
  const left = items.filter((i) => !answers[i.id]).length;
  const result = scoreBrief(items, answers);
  return (
    <section className={`${panel} flex flex-col gap-3 p-4`} aria-labelledby="brief-heading">
      <h2 id="brief-heading" className="font-display text-lg">
        {t.heading}
      </h2>
      <article className="border-2 border-ink/40 bg-bg p-3">
        <h3 className="font-bold">{project.brief.title}</h3>
        {project.brief.intro.map((p, i) => (
          <p key={i} className="mt-1">
            {p}
          </p>
        ))}
      </article>
      <p className="text-sm text-ink-muted">{t.help}</p>
      <ol className="flex flex-col gap-3">
        {items.map((item, n) => {
          const wrong = checked && result.wrong.includes(item.id);
          return (
            <li key={item.id} className="border-2 border-ink/30 p-2" data-brief-item={item.id}>
              <p>
                <span className="font-display text-ink-muted">{n + 1}. </span>
                {item.text}
              </p>
              <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label={item.text}>
                {KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={answers[item.id] === k}
                    disabled={checked}
                    onClick={() => setAnswers({ ...answers, [item.id]: k })}
                    data-kind={k}
                    className={
                      'min-h-11 border-2 px-2 text-sm focus-visible:outline-4 focus-visible:outline-focus ' +
                      (answers[item.id] === k
                        ? 'border-accent bg-accent/20 font-bold'
                        : 'border-ink/40 bg-bg')
                    }
                  >
                    {answers[item.id] === k && <span aria-hidden="true">● </span>}
                    {t.kinds[k]}
                  </button>
                ))}
              </div>
              {checked && (
                <p className={'mt-2 text-sm ' + (wrong ? 'text-danger' : 'text-safe')} role="note">
                  <span aria-hidden="true">{wrong ? '✗ ' : '✓ '}</span>
                  {wrong ? t.shouldBe(t.kinds[item.kind] ?? item.kind) : t.right}. {item.why}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink/40 bg-panel p-2">
        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          {checked ? (
            <>
              <p className="text-center font-display" role="status" data-testid="brief-score">
                {t.result(items.length - result.wrong.length, items.length)}
              </p>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => submitBrief(result.score)}
              >
                {t.next}
              </button>
            </>
          ) : (
            <>
              {left > 0 && (
                <p className="text-center text-sm text-ink-muted">{t.remaining(left)}</p>
              )}
              <button
                type="button"
                className={btnPrimary}
                disabled={left > 0}
                onClick={() => setChecked(true)}
              >
                {t.submit}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Plan({ project, sprint }: { project: ProjectDef; sprint: number }) {
  const focus = useAppStore((s) => s.projectFocus);
  const save = useAppStore((s) => s.save);
  const enterSprint = useAppStore((s) => s.enterSprint);
  const [chosen, setChosen] = useState<string[]>([]);
  const t = id.project.plan;
  const term = project.terms.sprint;
  const def = project.sprints[sprint - 1]!;
  const modeProgress = focus ? save?.modes[focus.modeId] : undefined;
  const slot = modeProgress?.practiceSession;
  const running = slot?.project?.projectId === project.id ? slot.project : undefined;
  const busy = slot && !running;
  const remaining = remainingCards(
    engineCards(project),
    projectProgressOf(modeProgress, project.id),
  );
  const byId = new Map(project.cards.map((c) => [c.id, c]));
  const picked = remaining.filter((c) => chosen.includes(c.id));
  const used = picked.reduce((n, c) => n + c.points, 0);

  if (running)
    return (
      <section className={`${panel} p-4`}>
        <button
          type="button"
          className={`${btnPrimary} w-full`}
          onClick={() => void enterSprint([])}
        >
          {id.project.resume(term, running.sprint)}
        </button>
      </section>
    );

  return (
    <section className={`${panel} flex flex-col gap-3 p-4`} aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="font-display text-lg">
        {t.heading(term, sprint)}
      </h2>
      <p>
        <strong>{t.goal}:</strong> {def.goal}
      </p>
      <p className="text-sm text-ink-muted">{t.help}</p>
      {def.surprises.length > 0 && <p className="text-sm text-accent">⚡ {t.surprise}</p>}
      <div
        className="sticky top-0 z-10 border-2 border-ink/40 bg-bg p-2"
        role="status"
        data-testid="capacity"
        data-used={used}
        data-capacity={def.capacity}
      >
        <p className="font-display">{t.capacity(used, def.capacity)}</p>
        <div className="mt-1 h-3 border-2 border-ink/50" aria-hidden="true">
          <div
            className="h-full bg-accent"
            style={{ width: `${Math.min(100, (used / def.capacity) * 100)}%` }}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          {
            key: 'backlog',
            title: t.backlog,
            cards: remaining.filter((c) => !chosen.includes(c.id)),
          },
          { key: 'sprint', title: t.chosen(term), cards: picked },
        ].map((col) => (
          <section key={col.key} aria-label={col.title} data-column={col.key}>
            <h3 className="mb-1 font-display text-ink-muted">
              {col.title} ({col.cards.length})
            </h3>
            <ul className="flex flex-col gap-2">
              {col.cards.map((c) => {
                const card = byId.get(c.id)!;
                const inSprint = chosen.includes(c.id);
                const fits = inSprint || canAdd(picked, c, def.capacity);
                return (
                  <li key={c.id} className="border-2 border-ink/40 bg-bg p-2" data-card={c.id}>
                    <p className="flex flex-wrap items-center gap-2">
                      <span
                        className={`border-2 px-1 font-display text-xs ${PRIORITY_CLASS[c.priority] ?? ''}`}
                      >
                        {t.priority[c.priority]}
                      </span>
                      <strong className="flex-1">{card.title}</strong>
                      <span className="font-display text-sm">{t.points(c.points)}</span>
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">{card.story}</p>
                    <button
                      type="button"
                      className={`${btnSecondary} mt-2 w-full text-sm`}
                      disabled={!fits}
                      onClick={() =>
                        setChosen(inSprint ? chosen.filter((x) => x !== c.id) : [...chosen, c.id])
                      }
                    >
                      {inSprint ? `← ${t.remove}` : fits ? `${t.add} →` : t.full}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t-2 border-ink/40 bg-panel p-2">
        <div className="mx-auto flex max-w-3xl flex-col gap-1">
          {busy ? (
            <p className="text-center text-sm text-ink-muted">{id.project.busy}</p>
          ) : (
            <>
              {chosen.length === 0 && (
                <p className="text-center text-sm text-ink-muted">{t.empty}</p>
              )}
              <button
                type="button"
                className={btnPrimary}
                disabled={chosen.length === 0}
                onClick={() => void enterSprint(chosen)}
              >
                {t.start(term, sprint)}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Velocity({ project, velocity }: { project: ProjectDef; velocity: readonly number[] }) {
  const max = Math.max(1, ...velocity, ...project.sprints.map((s) => s.capacity));
  return (
    <figure>
      <figcaption className="text-sm text-ink-muted">{id.project.retro.velocity}</figcaption>
      <ol className="mt-1 flex flex-col gap-1">
        {velocity.map((v, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="w-24 shrink-0">
              {project.terms.sprint} {i + 1}
            </span>
            <span
              className="h-4 bg-safe"
              style={{ width: `${(v / max) * 60}%` }}
              aria-hidden="true"
            />
            <span className="font-display">{v}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function Retro(p: {
  project: ProjectDef;
  sprint: number;
  outcome: { done: string[]; carried: string[]; donePoints: number; plannedPoints: number };
  pay: number;
  planScore: number;
}) {
  const t = id.project.retro;
  const save = useAppStore((s) => s.save);
  const focus = useAppStore((s) => s.projectFocus);
  const velocity = projectProgressOf(
    focus ? save?.modes[focus.modeId] : undefined,
    p.project.id,
  ).velocity;
  return (
    <section
      className={`${panel} flex flex-col gap-2 p-4`}
      data-testid="retro"
      aria-labelledby="retro-heading"
    >
      <h2 id="retro-heading" className="font-display text-lg text-accent">
        <span aria-hidden="true">🔁 </span>
        {t.heading(p.project.terms.sprint, p.sprint)}
      </h2>
      <p className="font-display">{t.done(p.outcome.donePoints, p.outcome.plannedPoints)}</p>
      <p>{t.plan(pct(p.planScore))}</p>
      <p className="font-display text-accent">{t.pay(p.pay)}</p>
      {p.outcome.carried.length > 0 && <p>{t.carried(p.outcome.carried.length)}</p>}
      <p className="text-sm text-ink-muted">
        {p.outcome.carried.length === 0 && p.planScore >= 1 ? t.good : t.improve}
      </p>
      <Velocity project={p.project} velocity={velocity} />
    </section>
  );
}

function Complete({ project }: { project: ProjectDef }) {
  const save = useAppStore((s) => s.save);
  const focus = useAppStore((s) => s.projectFocus);
  const goTo = useAppStore((s) => s.goTo);
  const progress = projectProgressOf(focus ? save?.modes[focus.modeId] : undefined, project.id);
  const t = id.project.complete;
  const total = progress.velocity.reduce((a, b) => a + b, 0);
  return (
    <section className={`${panel} flex flex-col gap-2 p-4`} data-testid="project-complete">
      <h2 className="font-display text-xl text-accent">
        <span aria-hidden="true">🎉 </span>
        {t.heading}
      </h2>
      <p>{t.brief(pct(progress.briefScore ?? 0))}</p>
      <p className="font-display">{t.total(total)}</p>
      <p className="text-sm text-ink-muted">{t.bonus(project.pay.completion)}</p>
      <Velocity project={project} velocity={progress.velocity} />
      <button type="button" className={btnPrimary} onClick={() => goTo('hub')}>
        {id.project.back}
      </button>
    </section>
  );
}
