import { describe, expect, it } from 'vitest';
import { analyticsEndpoint } from '../telemetry.ts';

describe('analyticsEndpoint', () => {
  it.each([
    ['https://telemetry.example/events', 'https://telemetry.example/events'],
    ['/__telemetry', '/__telemetry'],
    ['http://telemetry.example/events', null],
    ['//telemetry.example/events', null],
    ['bukan url', null],
    ['', null],
    [undefined, null],
  ])('%s → %s', (raw, expected) => {
    expect(analyticsEndpoint(raw)).toBe(expected);
  });
});
