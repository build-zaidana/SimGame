import { describe, expect, it } from 'vitest';
import { BEATS_PER_BAR, barNotes, midiToFreq, TRACKS } from '../compose.ts';

describe('midiToFreq', () => {
  it('A4 = 440 Hz, one octave doubles', () => {
    expect(midiToFreq(69)).toBeCloseTo(440);
    expect(midiToFreq(81)).toBeCloseTo(880);
  });
});

describe('barNotes', () => {
  it('is deterministic and every note fits inside the bar', () => {
    for (const track of ['office', 'desk'] as const) {
      for (let bar = 0; bar < 16; bar++) {
        const notes = barNotes(track, bar, 0);
        expect(barNotes(track, bar, 0)).toEqual(notes);
        for (const n of notes) {
          expect(n.t).toBeGreaterThanOrEqual(0);
          expect(n.t + n.dur).toBeLessThanOrEqual(BEATS_PER_BAR + 1e-9);
          expect(n.vol).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps melodic notes inside the track scale', () => {
    for (const track of ['office', 'desk'] as const) {
      const scale = new Set(TRACKS[track].scale.map((m) => m % 12));
      for (let bar = 0; bar < 8; bar++)
        for (const n of barNotes(track, bar, 0))
          if (n.voice === 'lead') expect(scale.has(n.midi % 12)).toBe(true);
    }
  });

  it('adds hi-hats and more notes when the shift clock runs low (intensity 1)', () => {
    const calm = barNotes('desk', 3, 0);
    const tense = barNotes('desk', 3, 1);
    expect(calm.some((n) => n.voice === 'hat')).toBe(false);
    expect(tense.filter((n) => n.voice === 'hat').length).toBeGreaterThanOrEqual(8);
  });

  it('follows the chord progression on the bass', () => {
    const roots = [0, 1, 2, 3].map(
      (bar) => barNotes('office', bar, 0).find((n) => n.voice === 'bass')!.midi % 12,
    );
    expect(roots).toEqual(TRACKS.office.progression.map((m) => m % 12));
  });
});
