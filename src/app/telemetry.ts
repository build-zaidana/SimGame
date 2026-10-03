import { noopTelemetry } from '../telemetry/NoopTelemetry.ts';
import type { Telemetry } from '../telemetry/Telemetry.ts';

/** Sink telemetri aktif. v1.0: no-op (PRD S6: analitik anonim mati secara default). */
export const telemetry: Telemetry = noopTelemetry;
