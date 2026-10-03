import {
  BEATS_PER_BAR,
  barNotes,
  midiToFreq,
  TRACKS,
  type NoteEvent,
  type Track,
} from './compose.ts';

/**
 * Pemutar musik latar: menjadwalkan bar berikutnya sedikit ke depan (lookahead) lewat WebAudio.
 * Volume sengaja pelan; berganti lagu dengan fade singkat.
 */
const LOOKAHEAD_S = 0.4;
const TICK_MS = 100;
const VOLUME = 0.05;

const WAVE: Record<NoteEvent['voice'], OscillatorType> = {
  bass: 'triangle',
  lead: 'square',
  pad: 'sine',
  hat: 'square',
};

class MusicPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private track: Track | null = null;
  private intensity: 0 | 1 = 0;
  private bar = 0;
  private nextBarAt = 0;
  private noise: AudioBuffer | null = null;

  /** Memutar `track` (null = diam). Aman dipanggil berulang dengan nilai sama. */
  play(track: Track | null, intensity: 0 | 1 = 0) {
    this.intensity = intensity;
    if (track === this.track) return;
    this.track = track;
    if (!track) {
      this.fadeOut();
      return;
    }
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      const now = this.ctx.currentTime;
      this.master?.gain.setTargetAtTime(0, now, 0.15);
      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0, now);
      master.gain.linearRampToValueAtTime(VOLUME, now + 0.8);
      master.connect(this.ctx.destination);
      this.master = master;
      this.bar = 0;
      this.nextBarAt = now + 0.1;
      if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), TICK_MS);
    } catch {
      // Audio tidak tersedia: diam saja.
    }
  }

  private fadeOut() {
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private schedule() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || !this.track) return;
    const secPerBeat = 60 / TRACKS[this.track].bpm;
    while (this.nextBarAt < ctx.currentTime + LOOKAHEAD_S) {
      for (const n of barNotes(this.track, this.bar, this.intensity))
        this.note(ctx, master, n, this.nextBarAt + n.t * secPerBeat, n.dur * secPerBeat);
      this.nextBarAt += BEATS_PER_BAR * secPerBeat;
      this.bar += 1;
    }
  }

  private note(ctx: AudioContext, out: AudioNode, n: NoteEvent, at: number, dur: number) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(n.vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(dur, 0.03));
    g.connect(out);
    if (n.voice === 'hat') {
      this.noise ??= (() => {
        const len = Math.floor(ctx.sampleRate * 0.05);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return buf;
      })();
      const src = ctx.createBufferSource();
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
      src.buffer = this.noise;
      src.connect(hp).connect(g);
      src.start(at);
      return;
    }
    const osc = ctx.createOscillator();
    osc.type = WAVE[n.voice];
    osc.frequency.setValueAtTime(midiToFreq(n.midi), at);
    osc.connect(g);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

export const music = new MusicPlayer();
