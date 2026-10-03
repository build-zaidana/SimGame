import { hashString } from '../../engine/rng.ts';

/**
 * Musik latar chiptune yang dikarang dari kode (PRD C2, ADR 022): tanpa file audio.
 * Fungsi murni: bar ke-n selalu menghasilkan not yang sama, jadi mudah diuji.
 */
export const BEATS_PER_BAR = 4;
export type Track = 'office' | 'desk';
export type Voice = 'bass' | 'lead' | 'pad' | 'hat';

export interface NoteEvent {
  /** Mulai, dalam ketukan dari awal bar. */
  t: number;
  /** Lama, dalam ketukan. */
  dur: number;
  midi: number;
  voice: Voice;
  vol: number;
}

interface TrackDef {
  bpm: number;
  /** Nada dasar akor per bar (MIDI), diulang. */
  progression: number[];
  /** Nada yang boleh dipakai melodi (MIDI, satu oktaf). */
  scale: number[];
  /** Interval akor dari nada dasar (mayor/minor ditentukan per bar). */
  chords: number[][];
}

export const TRACKS: Record<Track, TrackDef> = {
  // Kantor: santai, C mayor (C – Am – F – G).
  office: {
    bpm: 84,
    progression: [48, 45, 41, 43],
    scale: [60, 62, 64, 67, 69],
    chords: [
      [0, 4, 7],
      [0, 3, 7],
      [0, 4, 7],
      [0, 4, 7],
    ],
  },
  // Meja SOC: fokus, A minor (Am – F – C – G).
  desk: {
    bpm: 100,
    progression: [45, 41, 48, 43],
    scale: [57, 60, 62, 64, 67],
    chords: [
      [0, 3, 7],
      [0, 4, 7],
      [0, 4, 7],
      [0, 4, 7],
    ],
  },
};

export const midiToFreq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Not untuk satu bar. `intensity` 1 = jam shift hampir habis (hi-hat + melodi lebih rapat). */
export function barNotes(track: Track, bar: number, intensity: 0 | 1): NoteEvent[] {
  const def = TRACKS[track];
  const i = bar % def.progression.length;
  const root = def.progression[i]!;
  const chord = def.chords[i]!;
  const notes: NoteEvent[] = [];

  // Bas: nada dasar di ketukan 1 & 3 (kantor) atau tiap setengah ketukan (meja).
  const bassStep = track === 'desk' ? 0.5 : 2;
  for (let t = 0; t < BEATS_PER_BAR; t += bassStep) {
    const up = track === 'desk' && t % 1 !== 0 ? 12 : 0;
    notes.push({ t, dur: Math.min(bassStep, 1) * 0.9, midi: root + up, voice: 'bass', vol: 0.5 });
  }

  // Akor lembut sepanjang bar.
  for (const iv of chord)
    notes.push({ t: 0, dur: BEATS_PER_BAR, midi: root + 12 + iv, voice: 'pad', vol: 0.18 });

  // Melodi: pola tetap per bar (dari hash), hanya nada skala yang cocok dengan akor.
  const h = hashString(`${track}:${bar % 16}`);
  const step = intensity === 1 ? 0.5 : 1;
  const chordPcs = new Set(chord.map((iv) => (root + iv) % 12));
  const fitting = def.scale.filter((m) => chordPcs.has(m % 12));
  const pool = fitting.length > 0 ? fitting : def.scale;
  for (let k = 0, t = 0; t < BEATS_PER_BAR; k++, t += step) {
    const rest = ((h >>> (k % 24)) & 3) === 0;
    if (rest) continue;
    const pick = (h >>> ((k * 3) % 27)) % pool.length;
    const octave = intensity === 1 ? 12 : 0;
    notes.push({ t, dur: step * 0.8, midi: pool[pick]! + octave, voice: 'lead', vol: 0.32 });
  }

  // Hi-hat hanya saat tegang.
  if (intensity === 1)
    for (let t = 0; t < BEATS_PER_BAR; t += 0.25)
      notes.push({ t, dur: 0.05, midi: 0, voice: 'hat', vol: t % 1 === 0 ? 0.35 : 0.18 });

  return notes;
}
