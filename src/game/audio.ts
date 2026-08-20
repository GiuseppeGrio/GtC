// ── Audio sintetico: SFX, musichetta allegra, motore della Yaris ─────────

export class SFX {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private step = 0;
  muted = false;

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.05);
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0, when = 0) {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol: number, when = 0) {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g); g.connect(this.master);
    src.start(t0);
  }

  blip() { this.tone(660, 0.07, 'square', 0.12); }
  coin() { this.tone(988, 0.06, 'square', 0.14); this.tone(1319, 0.12, 'square', 0.14, 0, 0.06); }
  heart() { this.tone(740, 0.09, 'sine', 0.2); this.tone(1108, 0.16, 'sine', 0.18, 0, 0.07); }
  pop() { this.tone(300, 0.08, 'triangle', 0.25, 260); }
  hit() { this.noise(0.16, 0.3); this.tone(140, 0.18, 'sawtooth', 0.22, -60); }
  crash() { this.noise(0.35, 0.4); this.tone(90, 0.3, 'sawtooth', 0.2, -40); }
  horn() { this.tone(392, 0.4, 'sawtooth', 0.16); this.tone(494, 0.4, 'sawtooth', 0.16); }
  meow() { this.tone(720, 0.12, 'triangle', 0.2, 300); this.tone(900, 0.2, 'triangle', 0.16, -400, 0.12); }
  gull() { this.tone(1200, 0.1, 'square', 0.08, -500); this.tone(1400, 0.14, 'square', 0.07, -700, 0.12); }
  whoosh() { this.noise(0.25, 0.16); this.tone(500, 0.25, 'sine', 0.1, 400); }
  sparkle() { [1568, 1976, 2637].forEach((f, i) => this.tone(f, 0.14, 'sine', 0.12, 0, i * 0.06)); }
  chime() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.14, 0, i * 0.09)); }
  success() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, 'square', 0.1, 0, i * 0.08)); }
  fail() { this.tone(300, 0.2, 'sawtooth', 0.14, -120); this.tone(220, 0.3, 'sawtooth', 0.14, -90, 0.18); }
  boom() { this.noise(0.6, 0.4); this.tone(60, 0.6, 'sine', 0.3, -20); }
  swing() { this.noise(0.12, 0.14); this.tone(900, 0.12, 'sine', 0.1, -500); }
  levelup() { [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.14, 0, i * 0.07)); }

  startEngine() {
    if (!this.ctx || !this.master || this.engineOsc) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 40;
    this.engineGain.gain.value = 0;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320;
    this.engineOsc.connect(lp); lp.connect(this.engineGain); this.engineGain.connect(this.master);
    this.engineOsc.start();
  }
  setEngine(x: number, on: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(42 + x * 120, t, 0.06);
    this.engineGain.gain.setTargetAtTime(on ? 0.05 + x * 0.03 : 0, t, 0.08);
  }
  stopEngine() { if (this.engineOsc) { this.engineOsc.stop(); this.engineOsc = null; this.engineGain = null; } }

  // musichetta allegra: giro di Do con basso e arpeggio
  startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    const chords = [
      [261.6, 329.6, 392.0], [196.0, 246.9, 293.7], [220.0, 261.6, 329.6], [246.9, 293.7, 392.0],
    ];
    const bass = [130.8, 98.0, 110.0, 123.5];
    this.step = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.muted) return;
      const bar = Math.floor(this.step / 8) % 4;
      const beat = this.step % 8;
      const t0 = this.ctx.currentTime;
      const osc = (f: number, dur: number, type: OscillatorType, vol: number) => {
        if (!this.ctx || !this.musicGain) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.connect(g); g.connect(this.musicGain);
        o.start(t0); o.stop(t0 + dur + 0.02);
      };
      if (beat % 2 === 0) osc(bass[bar], 0.24, 'sine', 0.5);
      const n = chords[bar][beat % 3 === 0 ? 0 : beat % 3];
      osc(n * 2, 0.16, 'triangle', 0.22);
      if (beat === 7) osc(chords[bar][2] * 4, 0.1, 'sine', 0.1);
      this.step++;
    }, 190);
  }
  stopMusic() { if (this.musicTimer !== null) { clearInterval(this.musicTimer); this.musicTimer = null; } }
}
