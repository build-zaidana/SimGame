/**
 * Efek suara sederhana lewat WebAudio (tanpa file audio). Hanya berbunyi bila pengaturan
 * "Efek suara" menyala; AudioContext dibuat saat pertama dipakai (setelah interaksi pemain).
 */
type Sfx = 'correct' | 'wrong' | 'stamp';

const NOTES: Record<Sfx, [number, number][]> = {
  stamp: [[180, 0.06]],
  correct: [
    [523, 0.08],
    [784, 0.12],
  ],
  wrong: [
    [330, 0.1],
    [220, 0.16],
  ],
};

let ctx: AudioContext | null = null;

export function playSfx(kind: Sfx) {
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur] of NOTES[kind]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, t);
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
