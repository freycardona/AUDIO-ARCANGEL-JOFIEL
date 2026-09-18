import { MeditationTrackId } from "../types";

export const MEDITATION_PRESETS: Array<{ id: MeditationTrackId; name: string; frequency: string; baseHz: number }> = [
  { id: "luz-dorada-432", name: "Luz Dorada", frequency: "432 Hz", baseHz: 432 },
  { id: "sanacion-528", name: "Sanación", frequency: "528 Hz", baseHz: 528 },
  { id: "paz-396", name: "Paz Interior", frequency: "396 Hz", baseHz: 396 },
  { id: "intuicion-852", name: "Intuición", frequency: "852 Hz", baseHz: 852 },
];

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private oscNodes: OscillatorNode[] = [];
  private volume = 0.25;
  private currentTrack: MeditationTrackId = "luz-dorada-432";
  private listeners = new Set<(playing: boolean, track: MeditationTrackId) => void>();

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.isPlaying, this.currentTrack));
  }

  public subscribe(listener: (playing: boolean, track: MeditationTrackId) => void) {
    this.listeners.add(listener);
    listener(this.isPlaying, this.currentTrack);
    return () => this.listeners.delete(listener);
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain && this.isPlaying) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setTargetAtTime(Math.max(0.0001, this.volume), this.ctx.currentTime, 0.08);
    }
  }

  public play(track: MeditationTrackId = this.currentTrack, fadeSeconds = 2) {
    this.initContext();
    if (!this.ctx) return;
    if (this.isPlaying) this.stop(0);

    this.currentTrack = track;
    const preset = MEDITATION_PRESETS.find((item) => item.id === track) || MEDITATION_PRESETS[0];
    const now = this.ctx.currentTime;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, now);
    this.masterGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.volume), now + Math.max(0.01, fadeSeconds));
    this.masterGain.connect(this.ctx.destination);

    const freqs = [preset.baseHz / 2, preset.baseHz, preset.baseHz * 1.5, preset.baseHz * 2];
    freqs.forEach((frequency, index) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = index % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(frequency, now);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.18 / (index + 1), now);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      this.oscNodes.push(osc);
    });

    this.isPlaying = true;
    this.notify();
  }

  public stop(fadeSeconds = 2) {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const ctx = this.ctx;
    const gain = this.masterGain;
    const nodes = [...this.oscNodes];
    const seconds = Math.max(0, fadeSeconds);
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + Math.max(0.01, seconds));

    this.oscNodes = [];
    this.masterGain = null;
    this.isPlaying = false;
    this.notify();

    window.setTimeout(() => {
      nodes.forEach((osc) => {
        try { osc.stop(); osc.disconnect(); } catch {}
      });
      try { gain.disconnect(); } catch {}
    }, seconds * 1000 + 50);
  }

  public startCelestialPad(volume = 0.15) {
    this.setVolume(volume);
    this.play(this.currentTrack, 3);
  }

  public stopCelestialPad() {
    this.stop(2);
  }

  public playSingingBowlChime() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(528, now);
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
