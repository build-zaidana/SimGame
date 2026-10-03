/** Event belajar (PRD §10). Tanpa data pribadi; default no-op. */
export type TelemetryEvent =
  | { name: 'shift_started'; modeId: string; shiftId: string; playMode: string }
  | {
      name: 'case_decided';
      modeId: string;
      caseId: string;
      correct: boolean;
      evidenceScore: number;
      ms: number;
      hintsUsed: number;
    }
  | {
      name: 'shift_completed';
      modeId: string;
      shiftId: string;
      averageScore: number;
      stars: number;
    }
  | { name: 'review_answered'; itemId: string; correct: boolean }
  | { name: 'lesson_opened'; conceptId: string }
  | { name: 'save_exported' }
  | { name: 'save_imported' };

export interface Telemetry {
  track(e: TelemetryEvent): void;
  flush(): Promise<void>;
}
