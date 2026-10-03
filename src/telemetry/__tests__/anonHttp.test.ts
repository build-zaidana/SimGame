import { describe, expect, it, vi } from 'vitest';
import { AnonHttpTelemetry, combineTelemetry } from '../AnonHttpTelemetry.ts';
import type { Telemetry, TelemetryEvent } from '../Telemetry.ts';

const ENDPOINT = 'https://telemetry.example/events';
const INSTALL_ID = '6f1c2b8e-3a4d-4c5e-8f9a-0b1c2d3e4f5a';
const lesson = (conceptId: string): TelemetryEvent => ({ name: 'lesson_opened', conceptId });

function setup(opts: { consent?: boolean; ok?: boolean; batchSize?: number; maxQueue?: number }) {
  let consent = opts.consent ?? true;
  let ok = opts.ok ?? true;
  const send = vi.fn(async (_endpoint: string, _body: string) => ok);
  const t = new AnonHttpTelemetry({
    endpoint: ENDPOINT,
    identity: () => (consent ? { installId: INSTALL_ID } : null),
    send,
    now: () => '2026-10-03T11:42:57.123Z',
    batchSize: opts.batchSize ?? 20,
    maxQueue: opts.maxQueue ?? 200,
  });
  const bodies = () =>
    send.mock.calls.map(
      ([, body]) => JSON.parse(body) as { v: number; installId: string; events: unknown[] },
    );
  return {
    t,
    send,
    bodies,
    setConsent: (v: boolean) => (consent = v),
    setOk: (v: boolean) => (ok = v),
  };
}

describe('AnonHttpTelemetry (PRD S6)', () => {
  it('sends nothing without the player’s consent', async () => {
    const { t, send } = setup({ consent: false });
    t.track(lesson('url-anatomy'));
    await t.flush();
    expect(send).not.toHaveBeenCalled();
  });

  it('sends a batch with only the install id, the event and a minute timestamp', async () => {
    const { t, send, bodies } = setup({});
    t.track(lesson('url-anatomy'));
    t.track({ name: 'review_answered', itemId: 'q-1', correct: true });
    await t.flush();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toBe(ENDPOINT);
    expect(bodies()[0]).toEqual({
      v: 1,
      installId: INSTALL_ID,
      events: [
        { name: 'lesson_opened', conceptId: 'url-anatomy', at: '2026-10-03T11:42Z' },
        { name: 'review_answered', itemId: 'q-1', correct: true, at: '2026-10-03T11:42Z' },
      ],
    });
    await t.flush();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('flushes automatically when a batch is full', async () => {
    const { t, send, bodies } = setup({ batchSize: 3 });
    t.track(lesson('a'));
    t.track(lesson('b'));
    expect(send).not.toHaveBeenCalled();
    t.track(lesson('c'));
    await t.flush();
    expect(send).toHaveBeenCalledTimes(1);
    expect(bodies()[0]?.events).toHaveLength(3);
  });

  it('keeps events after a failed send and retries them first', async () => {
    const { t, send, bodies, setOk } = setup({ ok: false });
    t.track(lesson('a'));
    await t.flush();
    setOk(true);
    t.track(lesson('b'));
    await t.flush();
    expect(send).toHaveBeenCalledTimes(2);
    expect(bodies()[1]?.events.map((e) => (e as { conceptId: string }).conceptId)).toEqual([
      'a',
      'b',
    ]);
  });

  it('treats a throwing transport like a failed send', async () => {
    const send = vi.fn(async () => {
      throw new Error('offline');
    });
    const t = new AnonHttpTelemetry({
      endpoint: ENDPOINT,
      identity: () => ({ installId: INSTALL_ID }),
      send,
    });
    t.track(lesson('a'));
    await expect(t.flush()).resolves.toBeUndefined();
  });

  it('caps the queue while offline, dropping the oldest events', async () => {
    const { t, bodies, setOk } = setup({ ok: false, batchSize: 100, maxQueue: 3 });
    for (const c of ['a', 'b', 'c', 'd', 'e']) t.track(lesson(c));
    await t.flush();
    setOk(true);
    await t.flush();
    expect(
      bodies()
        .at(-1)
        ?.events.map((e) => (e as { conceptId: string }).conceptId),
    ).toEqual(['c', 'd', 'e']);
  });

  it('discards queued events when consent is withdrawn', async () => {
    const { t, send, setConsent } = setup({ ok: false });
    t.track(lesson('a'));
    await t.flush();
    setConsent(false);
    await t.flush();
    setConsent(true);
    send.mockClear();
    await t.flush();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('combineTelemetry', () => {
  it('forwards every event and flush to all sinks', async () => {
    const sink = (): Telemetry & { seen: TelemetryEvent[]; flushed: number } => {
      const s = {
        seen: [] as TelemetryEvent[],
        flushed: 0,
        track: (e: TelemetryEvent) => void s.seen.push(e),
        flush: async () => void s.flushed++,
      };
      return s;
    };
    const a = sink();
    const b = sink();
    const both = combineTelemetry(a, b);
    both.track({ name: 'save_exported' });
    await both.flush();
    expect(a.seen).toEqual([{ name: 'save_exported' }]);
    expect(b.seen).toEqual([{ name: 'save_exported' }]);
    expect([a.flushed, b.flushed]).toEqual([1, 1]);
  });
});
