import { describe, expect, it } from 'vitest';
import {
  MAX_EVENTS,
  SessionReportTelemetry,
  summarizeEvents,
  type LoggedEvent,
} from '../SessionReportTelemetry.ts';

function memoryLog(initial: LoggedEvent[] = []) {
  let stored = [...initial];
  return {
    load: async () => [...stored],
    save: async (events: LoggedEvent[]) => {
      stored = [...events];
    },
    get stored() {
      return stored;
    },
  };
}

const clock = () => {
  let t = 0;
  return () => new Date(Date.UTC(2026, 9, 3, 10, 0, t++)).toISOString();
};

describe('SessionReportTelemetry', () => {
  it('keeps events with a timestamp and persists them on flush', async () => {
    const log = memoryLog();
    const tel = new SessionReportTelemetry(log, clock());
    tel.track({ name: 'save_exported' });
    await tel.flush();
    expect(log.stored).toEqual([{ name: 'save_exported', at: '2026-10-03T10:00:00.000Z' }]);
  });

  it('appends to previously stored events', async () => {
    const log = memoryLog([{ name: 'save_imported', at: 'old' }]);
    const tel = new SessionReportTelemetry(log, clock());
    tel.track({ name: 'save_exported' });
    await tel.flush();
    expect(log.stored.map((e) => e.name)).toEqual(['save_imported', 'save_exported']);
  });

  it(`keeps at most ${MAX_EVENTS} events (newest win)`, async () => {
    const log = memoryLog();
    const tel = new SessionReportTelemetry(log, clock());
    for (let i = 0; i < MAX_EVENTS + 20; i++)
      tel.track({ name: 'lesson_opened', conceptId: `c${i}` });
    await tel.flush();
    expect(log.stored).toHaveLength(MAX_EVENTS);
    expect(log.stored.at(-1)).toMatchObject({ conceptId: `c${MAX_EVENTS + 19}` });
  });

  it('clear() empties memory and storage', async () => {
    const log = memoryLog([{ name: 'save_imported', at: 'x' }]);
    const tel = new SessionReportTelemetry(log, clock());
    await tel.clear();
    expect(await tel.events()).toEqual([]);
    expect(log.stored).toEqual([]);
  });
});

describe('summarizeEvents', () => {
  it('computes learning metrics for the play-test report', () => {
    const at = 'x';
    const events: LoggedEvent[] = [
      { name: 'shift_started', modeId: 'soc', shiftId: 'soc-01', playMode: 'relaxed', at },
      {
        name: 'case_decided',
        modeId: 'soc',
        caseId: 'a',
        correct: true,
        evidenceScore: 1,
        ms: 20_000,
        hintsUsed: 0,
        at,
      },
      {
        name: 'case_decided',
        modeId: 'soc',
        caseId: 'b',
        correct: false,
        evidenceScore: 0.5,
        ms: 40_000,
        hintsUsed: 2,
        at,
      },
      { name: 'shift_completed', modeId: 'soc', shiftId: 'soc-01', averageScore: 70, stars: 2, at },
      { name: 'review_answered', itemId: 'q1', correct: true, at },
      { name: 'review_answered', itemId: 'q2', correct: false, at },
      { name: 'lesson_opened', conceptId: 'url-anatomy', at },
    ];
    expect(summarizeEvents(events)).toEqual({
      shiftsStarted: 1,
      shiftsCompleted: [{ shiftId: 'soc-01', averageScore: 70, stars: 2 }],
      cases: 2,
      caseAccuracy: 0.5,
      avgEvidenceScore: 0.75,
      avgDecisionSeconds: 30,
      hintsUsed: 2,
      reviewAnswered: 2,
      reviewAccuracy: 0.5,
      lessonsOpened: 1,
    });
  });
});
