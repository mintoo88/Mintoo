/**
 * Procedural Web Audio API sound synthesizer for Cash Crunch
 * Generates custom retro-arcade sounds for paper shredding, flutters,
 * cash chimes, electric sparks, explosions, and UI clicks without external audio files.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private shredLoopGain: GainNode | null = null;
  private shredLoopFilter: BiquadFilterNode | null = null;
  private isShreddingLoopActive: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val && this.isShreddingLoopActive) {
      this.stopShredLoop();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * UI Click / Tap
   */
  public playClick() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  /**
   * Paper note dispensed / fluttering onto table
   */
  public playDispense() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.08);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  /**
   * Continuous shredder mechanical grind loop while dragging / shredding
   */
  public startShredLoop() {
    if (!this.enabled || this.isShreddingLoopActive) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.isShreddingLoopActive = true;

      // Noise source
      const bufferSize = this.ctx.sampleRate * 1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      this.shredLoopFilter = this.ctx.createBiquadFilter();
      this.shredLoopFilter.type = 'bandpass';
      this.shredLoopFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
      this.shredLoopFilter.Q.value = 2.0;

      this.shredLoopGain = this.ctx.createGain();
      this.shredLoopGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.shredLoopGain.gain.exponentialRampToValueAtTime(0.09, this.ctx.currentTime + 0.05);

      noise.connect(this.shredLoopFilter);
      this.shredLoopFilter.connect(this.shredLoopGain);
      this.shredLoopGain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Audio fallback
    }
  }

  public stopShredLoop() {
    if (!this.isShreddingLoopActive || !this.ctx || !this.shredLoopGain) {
      this.isShreddingLoopActive = false;
      return;
    }
    try {
      const now = this.ctx.currentTime;
      this.shredLoopGain.gain.setValueAtTime(this.shredLoopGain.gain.value, now);
      this.shredLoopGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      setTimeout(() => {
        this.isShreddingLoopActive = false;
        this.shredLoopGain = null;
        this.shredLoopFilter = null;
      }, 100);
    } catch {
      this.isShreddingLoopActive = false;
    }
  }

  /**
   * Cash earned / note destroyed chime
   */
  public playCashChime(combo: number = 1) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const baseFreq = 523.25; // C5
    const semitones = Math.min(combo - 1, 12);
    const freq = baseFreq * Math.pow(2, semitones / 12);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.2);
    osc2.stop(now + 0.2);
  }

  /**
   * Heavy metal clank for Reinforced note
   */
  public playHeavyClank() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Electric spark / lightning zap for Spark note
   */
  public playSpark() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.04);
    osc.frequency.setValueAtTime(1800, this.ctx.currentTime + 0.08);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Explosion sound for Burst note
   */
  public playExplosion() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  /**
   * Golden note celebratory shimmer
   */
  public playGoldenChime() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.05);

      const start = this.ctx!.currentTime + idx * 0.05;
      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  /**
   * Prestige fanfare
   */
  public playPrestige() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const chords = [440, 554.37, 659.25, 880, 1108.73];
    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.06);

      const start = this.ctx!.currentTime + idx * 0.06;
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.8);
    });
  }

  /**
   * Vintage rotary phone two-tone ring (Mr. Buck calling!)
   */
  public playPhoneRing() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.4].forEach((burstOffset) => {
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now + burstOffset);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now + burstOffset);

      gain.gain.setValueAtTime(0.12, now + burstOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + burstOffset + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx!.destination);

      osc1.start(now + burstOffset);
      osc2.start(now + burstOffset);
      osc1.stop(now + burstOffset + 0.25);
      osc2.stop(now + burstOffset + 0.25);
    });
  }

  /**
   * Retro 8-bit typewriter chatter for Mr. Buck's dialogue
   */
  public playPhoneChatter() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const pitches = [180, 220, 250, 280, 310];
    const pitch = pitches[Math.floor(Math.random() * pitches.length)];

    osc.type = 'square';
    osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.8, this.ctx.currentTime + 0.04);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Diamond shatter / Piercing shards
   */
  public playDiamondShatter() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const freqs = [1800, 2400, 3200, 4100];
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + idx * 0.02);

      const start = this.ctx!.currentTime + idx * 0.02;
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  /**
   * Prestige Coin Ping
   */
  public playCoinSound() {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.06); // E6

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }
}

export const soundService = new SoundSynthesizer();
