/**
 * Efek suara sederhana lewat WebAudio (tanpa file audio). Hanya berbunyi bila pengaturan
 * "Efek suara" menyala; AudioContext dibuat saat pertama dipakai (setelah interaksi pemain).
 */
export type Sfx =
  'correct' | 'wrong' | 'stamp' | 'arrive' | 'bell' | 'blip' | 'tick' | 'coin' | 'star' | 'combo';

/** [frekuensi Hz, durasi detik, bentuk gelombang]. */
const NOTES: Record<Exclude<Sfx, 'stamp'>, [number, number, OscillatorType][]> = {
  correct: [
    [523, 0.08, 'square'],
    [784, 0.14, 'square'],
  ],
  wrong: [
    [330, 0.1, 'square'],
    [220, 0.18, 'square'],
  ],
  arrive: [
    [988, 0.05, 'triangle'],
    [1319, 0.08, 'triangle'],
  ],
  bell: [
    [784, 0.18, 'triangle'],
    [659, 0.18, 'triangle'],
    [523, 0.4, 'triangle'],
  ],
  /** Suara "bicara" per beberapa huruf saat teks dialog mengetik. */
  blip: [[440, 0.03, 'square']],
  /** Menandai bukti. */
  tick: [[1760, 0.025, 'square']],
  coin: [
    [988, 0.05, 'square'],
    [1319, 0.12, 'square'],
  ],
  star: [
    [659, 0.06, 'triangle'],
    [988, 0.06, 'triangle'],
    [1319, 0.16, 'triangle'],
  ],
  /** Keputusan tepat beruntun: arpeggio naik. */
  combo: [
    [784, 0.05, 'square'],
    [988, 0.05, 'square'],
    [1175, 0.05, 'square'],
    [1568, 0.12, 'square'],
  ],
};
/** Volume per efek; yang sering berbunyi dibuat lebih pelan. */
const GAIN: Partial<Record<Sfx, number>> = { blip: 0.02, tick: 0.03 };

let ctx: AudioContext | null = null;

/** Stempel: hentakan rendah + desis kertas pendek. */
function stamp(ac: AudioContext, t: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.17);

  const len = Math.floor(ac.sampleRate * 0.06);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = ac.createBufferSource();
  const ng = ac.createGain();
  noise.buffer = buf;
  ng.gain.value = 0.12;
  noise.connect(ng).connect(ac.destination);
  noise.start(t);
}

/** `pitch`: pengali frekuensi (mis. 1.06 ≈ naik satu semitone). */
export function playSfx(kind: Sfx, delaySec = 0, pitch = 1) {
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime + delaySec;
    if (kind === 'stamp') {
      stamp(ctx, t);
      return;
    }
    for (const [freq, dur, type] of NOTES[kind]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq * pitch;
      gain.gain.setValueAtTime(GAIN[kind] ?? 0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    }
  } catch {
    // Audio tidak tersedia: abaikan.
  }
}
