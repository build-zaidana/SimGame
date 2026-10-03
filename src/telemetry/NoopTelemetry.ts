import type { Telemetry } from './Telemetry.ts';

export const noopTelemetry: Telemetry = {
  track() {},
  async flush() {},
};
