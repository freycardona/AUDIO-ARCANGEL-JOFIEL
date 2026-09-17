/**
 * Meditative Ambient Sound Engine using Web Audio API
 * Generates an ethereal 432Hz harmonic bed and gentle celestial chimes
 */

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private oscNodes: OscillatorNode[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public startCelestialPad(volume = 0.15) {
    this.initContext();
    if (!this.ctx) return;
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(
      volume,
      this.ctx.currentTime + 3
    );
    this.masterGain.connect(this.ctx.destination);

    // Warm sacred frequencies: Root 432Hz, 216Hz, 648Hz (fifth), and 864Hz
    const freqs = [216, 432, 648, 864];

    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);

      // Lowpass filter to ensure buttery soft, celestial sound
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      oscGain.gain.setValueAtTime(0.2 / (idx + 1), this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start();
      this.oscNodes.push(osc);
    });
  }

  public stopCelestialPad() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    this.masterGain.gain.setValueAtTime(
      this.masterGain.gain.value,
      this.ctx.currentTime
    );
    this.masterGain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.ctx.currentTime + 2
    );

    setTimeout(() => {
      this.oscNodes.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {}
      });
      this.oscNodes = [];
      this.isPlaying = false;
    }, 2100);
  }

  public playSingingBowlChime() {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(528, now); // Solfeggio 528Hz frequency (Miracle/Transformation)
    osc.frequency.exponentialRampToValueAtTime(526, now + 4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 4.6);
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

export const ambientSound = new AmbientSoundEngine();
