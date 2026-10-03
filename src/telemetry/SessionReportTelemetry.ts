import type { Telemetry, TelemetryEvent } from './Telemetry.ts';

/**
 * Telemetri lokal untuk uji main: event disimpan HANYA di perangkat (maks. MAX_EVENTS) dan bisa
 * diekspor dari layar tersembunyi "Laporan Belajar". Tidak ada yang dikirim ke server.
 */
export const MAX_EVENTS = 500;

export type LoggedEvent = TelemetryEvent & { at: string };

/** Penyimpanan log event; implementasinya di persistence/ (aturan lapisan). */
export interface EventLog {
  load(): Promise<LoggedEvent[]>;
  save(events: LoggedEvent[]): Promise<void>;
}

export class SessionReportTelemetry implements Telemetry {
  private readonly log: EventLog;
  private readonly now: () => string;
  private loaded: Promise<LoggedEvent[]> | null = null;
  private pending: LoggedEvent[] = [];
  private writing: Promise<void> = Promise.resolve();

  constructor(log: EventLog, now: () => string = () => new Date().toISOString()) {
    this.log = log;
    this.now = now;
  }

  private base(): Promise<LoggedEvent[]> {
    this.loaded ??= this.log.load().catch(() => []);
    return this.loaded;
  }

  track(e: TelemetryEvent): void {
    this.pending.push({ ...e, at: this.now() });
    void this.flush();
  }

  /** Menggabungkan event baru ke log dan menyimpannya (berurutan). */
  flush(): Promise<void> {
    this.writing = this.writing.then(async () => {
      if (this.pending.length === 0) return;
      const all = [...(await this.base()), ...this.pending].slice(-MAX_EVENTS);
      this.pending = [];
      this.loaded = Promise.resolve(all);
      await this.log.save(all).catch(() => undefined);
    });
    return this.writing;
  }

  async events(): Promise<LoggedEvent[]> {
    await this.flush();
    return [...(await this.base())];
  }

  async clear(): Promise<void> {
    await this.flush();
    this.loaded = Promise.resolve([]);
    await this.log.save([]);
  }
}

export interface LearningSummary {
  shiftsStarted: number;
  shiftsCompleted: { shiftId: string; averageScore: number; stars: number }[];
  cases: number;
  caseAccuracy: number;
  avgEvidenceScore: number;
  avgDecisionSeconds: number;
  hintsUsed: number;
  reviewAnswered: number;
  reviewAccuracy: number;
  lessonsOpened: number;
}

const avg = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarizeEvents(events: readonly LoggedEvent[]): LearningSummary {
  const cases = events.filter((e) => e.name === 'case_decided');
  const reviews = events.filter((e) => e.name === 'review_answered');
  return {
    shiftsStarted: events.filter((e) => e.name === 'shift_started').length,
    shiftsCompleted: events.flatMap((e) =>
      e.name === 'shift_completed'
        ? [{ shiftId: e.shiftId, averageScore: e.averageScore, stars: e.stars }]
        : [],
    ),
    cases: cases.length,
    caseAccuracy: round2(avg(cases.map((c) => (c.correct ? 1 : 0)))),
    avgEvidenceScore: round2(avg(cases.map((c) => c.evidenceScore))),
    avgDecisionSeconds: Math.round(avg(cases.map((c) => c.ms)) / 1000),
    hintsUsed: cases.reduce((a, c) => a + c.hintsUsed, 0),
    reviewAnswered: reviews.length,
    reviewAccuracy: round2(avg(reviews.map((r) => (r.correct ? 1 : 0)))),
    lessonsOpened: events.filter((e) => e.name === 'lesson_opened').length,
  };
}
