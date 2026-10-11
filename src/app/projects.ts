/**
 * Alur proyek klien di lapisan aplikasi (ADR 032): status langkah, menyimpan hasil brief, membuat
 * sesi sprint dari kartu yang direncanakan, dan menyimpan hasil sprint (gaji per poin selesai).
 */
import type { ProjectDef } from '../content/schemas.ts';
import {
  commitSprint,
  newProjectProgress,
  remainingCards,
  scorePlan,
  sprintOutcome,
  sprintPlan,
  type ProjectCard,
  type ProjectProgress,
  type SprintOutcome,
} from '../engine/project.ts';
import type { SessionProject, ShiftPlan, ShiftSession } from '../engine/types.ts';
import { newModeProgress, type ModeProgress, type SaveData } from '../persistence/saveSchema.ts';

export type ProjectStep =
  | { kind: 'locked'; afterShift: number }
  | { kind: 'brief' }
  | { kind: 'planning'; sprint: number }
  | { kind: 'done' };

/** Kartu konten → bentuk engine. */
export const engineCards = (project: ProjectDef): ProjectCard[] =>
  project.cards.map(({ id, points, priority, caseId }) => ({ id, points, priority, caseId }));

export function projectProgressOf(
  progress: ModeProgress | undefined,
  projectId: string,
): ProjectProgress {
  return progress?.projects[projectId] ?? newProjectProgress();
}

/** Langkah berikutnya sebuah proyek untuk pemain ini. */
export function projectStep(project: ProjectDef, progress: ModeProgress | undefined): ProjectStep {
  // `unlockedShift` = shift berikutnya, jadi shift ke-n selesai bila nilainya > n.
  if ((progress?.unlockedShift ?? 1) <= project.unlockAfterShift)
    return { kind: 'locked', afterShift: project.unlockAfterShift };
  const p = projectProgressOf(progress, project.id);
  if (p.completedAt !== undefined) return { kind: 'done' };
  if (p.briefScore === undefined) return { kind: 'brief' };
  return { kind: 'planning', sprint: p.sprintsDone + 1 };
}

function withProject(
  save: SaveData,
  modeId: string,
  projectId: string,
  change: (
    p: ProjectProgress,
    mode: ModeProgress,
  ) => { project: ProjectProgress; mode?: ModeProgress },
  now: string,
): SaveData {
  const mode = save.modes[modeId] ?? newModeProgress();
  const r = change(projectProgressOf(mode, projectId), mode);
  const base = r.mode ?? mode;
  return {
    ...save,
    updatedAt: now,
    modes: {
      ...save.modes,
      [modeId]: { ...base, projects: { ...base.projects, [projectId]: r.project } },
    },
  };
}

export function commitBrief(
  save: SaveData,
  modeId: string,
  projectId: string,
  score: number,
  now: string,
): SaveData {
  return withProject(
    save,
    modeId,
    projectId,
    (p) => ({ project: { ...p, briefScore: score } }),
    now,
  );
}

/** Rencana shift untuk sprint berikutnya dari kartu yang dipilih pemain, plus penanda sesi. */
export function startSprint(
  project: ProjectDef,
  modeId: string,
  progress: ModeProgress,
  cardIds: readonly string[],
): { plan: ShiftPlan; marker: SessionProject } {
  const p = projectProgressOf(progress, project.id);
  const sprint = p.sprintsDone + 1;
  const def = project.sprints[sprint - 1] ?? project.sprints[project.sprints.length - 1]!;
  const remaining = remainingCards(engineCards(project), p);
  const selected = remaining.filter((c) => cardIds.includes(c.id));
  return {
    plan: sprintPlan({
      projectId: project.id,
      modeId,
      sprint,
      level: project.level,
      cards: selected,
      surprises: def.surprises,
      durationGameMinutes: project.durationGameMinutes,
      realSecondsPerGameMinute: project.realSecondsPerGameMinute,
    }),
    marker: {
      projectId: project.id,
      sprint,
      cardIds: selected.map((c) => c.id),
      planScore: scorePlan(remaining, selected, def.capacity),
    },
  };
}

/** Menyimpan hasil sprint: kartu selesai, gaji per poin, bonus bila sprint terakhir. */
export function commitProjectSprint(
  save: SaveData,
  session: ShiftSession,
  project: ProjectDef,
  now: string,
): { save: SaveData; outcome: SprintOutcome; pay: number; completed: boolean } {
  const marker = session.project;
  const planned = engineCards(project).filter((c) => marker?.cardIds.includes(c.id));
  const outcome = sprintOutcome(session, planned);
  let completed = false;
  let pay = 0;
  const next = withProject(
    save,
    session.modeId,
    project.id,
    (p, mode) => {
      const committed = commitSprint(p, outcome, marker?.planScore ?? 0);
      completed = committed.sprintsDone >= project.sprints.length;
      pay = outcome.donePoints * project.pay.perPoint + (completed ? project.pay.completion : 0);
      const { practiceSession: _done, ...rest } = mode;
      return {
        project: completed ? { ...committed, completedAt: now } : committed,
        mode: { ...rest, wallet: mode.wallet + pay },
      };
    },
    now,
  );
  return { save: next, outcome, pay, completed };
}
