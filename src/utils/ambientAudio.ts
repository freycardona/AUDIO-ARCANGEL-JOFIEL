/**
 * Meditation Music & Ambient Sound Engine using Web Audio API
 * Provides 4 sacred synthesized meditation soundscapes, custom track loading,
 * independent volume mixing, and offline rendering to export combined WAVs.
 */
import { MeditationTrack, MeditationTrackId } from "../types";
import { audioBufferToWav } from "./wavUtils";

export const MEDITATION_PRESETS: MeditationTrack[] = [
  {
    id: "rayo-blanco-gabriel-741",
    name: "Rayo Blanco de Gabriel (741 Hz)",
    subtitle: "Pureza, Claridad y Comunicación Sagrada",
    frequency: "741 Hz • Frecuencia del Arcángel Gabriel",
    description:
      "Frecuencia sagrada Solfeggio del Rayo Blanco y la pureza. Despierta la intuición, limpia los pensamientos confusos y facilita la resolución pacífica y buenas noticias.",
    recommended: true,
    bgGlow: "from-sky-400/20 to-indigo-300/10",
  },
  {
    id: "luz-dorada-432",
    name: "Luz Dorada de Jofiel (432 Hz)",
    subtitle: "Pads Celestes y Rayo de Iluminación",
    frequency: "432 Hz • Armonía Natural",
    description:
      "Acordes etéreos y cálidos afinados en la frecuencia matemática universal de 432 Hz, ideal para calmar la mente y conectar con la sabiduría del Arcángel Jofiel.",
    recommended: false,
    bgGlow: "from-amber-500/20 to-yellow-500/10",
  },
  {
    id: "solfeggio-528",
    name: "Solfeggio Milagro (528 Hz)",
    subtitle: "Claridad Mental y Paz Profunda",
    frequency: "528 Hz • Frecuencia de la Sabiduría",
    description:
      "Tono sagrado Solfeggio conocido por facilitar la transformación, disolver la confusión, y despertar la inspiración divina.",
    recommended: false,
    bgGlow: "from-yellow-400/20 to-amber-600/10",
  },
  {
    id: "cuencos-oceano",
    name: "Cuencos Tibetanos y Océano de Paz",
    subtitle: "Resonancia Profunda y Respiración",
    frequency: "136.1 Hz (Om) + 432 Hz",
    description:
      "Resonancias graves de cuencos de cuarzo y bronce con suaves olas de respiración rítmica que acompañan los silencios de la oración.",
    recommended: false,
    bgGlow: "from-amber-600/20 to-stone-800/20",
  },
  {
    id: "santuario-viento",
    name: "Santuario Angélico y Campanas",
    subtitle: "Atmósfera Serena y Campanadas Pentatónicas",
    frequency: "Armónicos Pentatónicos",
    description:
      "Capas sutiles de aire y armónicos celestiales con delicados toques de campana que elevan el espíritu hacia la gratitud.",
    recommended: false,
    bgGlow: "from-yellow-300/20 to-amber-500/15",
  },
];

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterMusicGain: GainNode | null = null;
  private currentTrack: MeditationTrackId = "luz-dorada-432";
  private musicVolume = 0.25; // Default peaceful background level

  // Active oscillator and audio nodes
  private activeNodes: (AudioNode | { stop: () => void; disconnect: () => void })[] = [];
  private lfoOsc: OscillatorNode | null = null;
  private intervalChimeTimer: any = null;

  // Custom user uploaded track buffer
  private customBuffer: AudioBuffer | null = null;
  private customBufferSource: AudioBufferSourceNode | null = null;
  private customFileName: string | null = null;

  // State change listeners
  private listeners: ((playing: boolean, track: MeditationTrackId) => void)[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public subscribe(cb: (playing: boolean, track: MeditationTrackId) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.isPlaying, this.currentTrack));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): MeditationTrackId {
    return this.currentTrack;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getCustomFileName(): string | null {
    return this.customFileName;
  }

  public setTrack(track: MeditationTrackId) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stop();
    }
    this.currentTrack = track;
    this.notify();
    if (wasPlaying) {
      setTimeout(() => this.play(this.currentTrack), 100);
    }
  }

  public setVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterMusicGain) {
      this.masterMusicGain.gain.setValueAtTime(
        this.musicVolume,
        this.ctx.currentTime
      );
    }
  }

  /**
   * Start playing meditation music with smooth fade-in
   */
  public play(trackId?: MeditationTrackId, fadeTime = 2) {
    this.initContext();
    if (!this.ctx) return;

    if (trackId) {
      this.currentTrack = trackId;
    }

    if (this.isPlaying) {
      // If already playing same track, just ensure volume
      if (this.masterMusicGain) {
        this.masterMusicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterMusicGain.gain.linearRampToValueAtTime(
          this.musicVolume,
          this.ctx.currentTime + 1
        );
      }
      return;
    }

    this.stopActiveNodes();

    this.masterMusicGain = this.ctx.createGain();
    this.masterMusicGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.masterMusicGain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, this.musicVolume),
      this.ctx.currentTime + fadeTime
    );
    this.masterMusicGain.connect(this.ctx.destination);

    this.isPlaying = true;
    this.notify();

    if (this.currentTrack === "custom" && this.customBuffer) {
      this.playCustomBuffer(this.ctx, this.masterMusicGain);
    } else {
      this.synthesizeSoundscape(this.ctx, this.masterMusicGain, this.currentTrack);
    }
  }

  /**
   * Stop playing meditation music with smooth fade-out
   */
  public stop(fadeTime = 1.5) {
    if (!this.isPlaying || !this.ctx || !this.masterMusicGain) {
      this.stopActiveNodes();
      this.isPlaying = false;
      this.notify();
      return;
    }

    const now = this.ctx.currentTime;
    this.masterMusicGain.gain.cancelScheduledValues(now);
    this.masterMusicGain.gain.setValueAtTime(this.masterMusicGain.gain.value, now);
    this.masterMusicGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeTime);

    this.isPlaying = false;
    this.notify();

    setTimeout(() => {
      this.stopActiveNodes();
    }, fadeTime * 1000 + 100);
  }

  private stopActiveNodes() {
    if (this.intervalChimeTimer) {
      clearInterval(this.intervalChimeTimer);
      this.intervalChimeTimer = null;
    }

    this.activeNodes.forEach((node) => {
      try {
        if ("stop" in node && typeof node.stop === "function") {
          node.stop();
        }
        if ("disconnect" in node && typeof node.disconnect === "function") {
          node.disconnect();
        }
      } catch {}
    });
    this.activeNodes = [];

    if (this.customBufferSource) {
      try {
        this.customBufferSource.stop();
        this.customBufferSource.disconnect();
      } catch {}
      this.customBufferSource = null;
    }
  }

  /**
   * Synthesize real-time polyphonic ambient soundscapes
   */
  private synthesizeSoundscape(
    context: BaseAudioContext,
    destGain: GainNode,
    trackId: MeditationTrackId
  ) {
    const now = context.currentTime;

    if (trackId === "luz-dorada-432") {
      // Golden Ray 432 Hz: Ethereal Pad with warm octave root, fifth, and major ninth
      // Chords based on 432 Hz: 108Hz (sub), 216Hz (body), 324Hz (fifth), 432Hz (radiance), 648Hz, 864Hz
      const frequencies = [108, 216, 324, 432, 648, 864];

      // Slow Breathing LFO filter
      const mainFilter = context.createBiquadFilter();
      mainFilter.type = "lowpass";
      mainFilter.frequency.setValueAtTime(550, now);
      mainFilter.connect(destGain);

      // LFO for filter breath (period ~10s for deep meditation breathing)
      if (context instanceof AudioContext) {
        const lfo = context.createOscillator();
        const lfoGain = context.createGain();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.08, now); // ~12.5 seconds wave
        lfoGain.gain.setValueAtTime(140, now);
        lfo.connect(lfoGain);
        lfoGain.connect(mainFilter.frequency);
        lfo.start(now);
        this.activeNodes.push(lfo, lfoGain);
      }

      frequencies.forEach((freq, idx) => {
        const osc = context.createOscillator();
        const oscGain = context.createGain();

        // Alternating warm waveforms
        osc.type = idx === 0 ? "sine" : idx % 2 === 0 ? "triangle" : "sine";
        // Subtle organic detuning for lush shimmer
        const detune = (idx - 2.5) * 4;
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);

        const relativeWeight = 0.28 / Math.sqrt(idx + 1);
        oscGain.gain.setValueAtTime(relativeWeight, now);

        osc.connect(oscGain);
        oscGain.connect(mainFilter);
        osc.start(now);
        this.activeNodes.push(osc, oscGain);
      });

      // Periodic gentle celestial chime every 24 seconds
      if (context instanceof AudioContext) {
        this.intervalChimeTimer = setInterval(() => {
          if (this.isPlaying) {
            this.playSingingBowlChime(432, 0.08);
          }
        }, 24000);
      }
    } else if (trackId === "solfeggio-528") {
      // Solfeggio 528 Hz: Transformation, peace, clarity
      // Harmonics: 132Hz (grounding), 264Hz, 396Hz, 528Hz, 792Hz, 1056Hz
      const frequencies = [132, 264, 396, 528, 792, 1056];

      const bandpass = context.createBiquadFilter();
      bandpass.type = "lowpass";
      bandpass.frequency.setValueAtTime(750, now);
      bandpass.connect(destGain);

      frequencies.forEach((freq, idx) => {
        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.type = idx === 3 ? "sine" : "triangle"; // Pure 528Hz sine
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx % 2 === 0 ? 3 : -3), now);

        const amp = freq === 528 ? 0.35 : 0.2 / (idx + 1);
        gain.gain.setValueAtTime(amp, now);

        osc.connect(gain);
        gain.connect(bandpass);
        osc.start(now);
        this.activeNodes.push(osc, gain);
      });

      if (context instanceof AudioContext) {
        this.intervalChimeTimer = setInterval(() => {
          if (this.isPlaying) {
            this.playSingingBowlChime(528, 0.12);
          }
        }, 18000);
      }
    } else if (trackId === "cuencos-oceano") {
      // Tibetan Singing Bowls + Organic Ocean Breathing
      // Om frequency 136.1 Hz + harmonics + filtered pink noise
      const bowlFreqs = [136.1, 272.2, 408.3, 544.4];

      bowlFreqs.forEach((f, idx) => {
        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);
        osc.detune.setValueAtTime(idx * 2 - 3, now);

        const amp = 0.3 / (idx + 1);
        gain.gain.setValueAtTime(amp, now);

        osc.connect(gain);
        gain.connect(destGain);
        osc.start(now);
        this.activeNodes.push(osc, gain);
      });

      // Ocean wave simulation using filtered noise with gentle swell
      const bufferSize = context.sampleRate * 4;
      const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.1;
        b2 = 0.86 * b2 + white * 0.3;
        output[i] = (b0 + b1 + b2) * 0.15;
      }

      const noise = context.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const oceanFilter = context.createBiquadFilter();
      oceanFilter.type = "bandpass";
      oceanFilter.frequency.setValueAtTime(280, now);
      oceanFilter.Q.setValueAtTime(1.2, now);

      const oceanGain = context.createGain();
      oceanGain.gain.setValueAtTime(0.08, now);

      noise.connect(oceanFilter);
      oceanFilter.connect(oceanGain);
      oceanGain.connect(destGain);
      noise.start(now);
      this.activeNodes.push(noise, oceanFilter, oceanGain);
    } else if (trackId === "santuario-viento") {
      // Angelic Sanctuary: Warm soft fifths + pentatonic bell chimes
      const sanctuaryFreqs = [174, 261.63, 392.0, 523.25, 659.25]; // C4, G4, C5, E5

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(620, now);
      filter.connect(destGain);

      sanctuaryFreqs.forEach((f, idx) => {
        const osc = context.createOscillator();
        const gain = context.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now);
        osc.detune.setValueAtTime((idx - 2) * 3, now);

        gain.gain.setValueAtTime(0.2 / Math.sqrt(idx + 1), now);

        osc.connect(gain);
        gain.connect(filter);
        osc.start(now);
        this.activeNodes.push(osc, gain);
      });
    } else if (trackId === "rayo-blanco-gabriel-741") {
      // White Ray of Archangel Gabriel (741 Hz): Solfeggio frequency of clarity, intuition, expression and purity
      // Harmonics: 185.25Hz, 370.5Hz, 741Hz (fundamental), 1111.5Hz, 1482Hz
      const frequencies = [185.25, 370.5, 741, 1111.5];

      // Crystalline high-clarity low-pass filter
      const purityFilter = context.createBiquadFilter();
      purityFilter.type = "lowpass";
      purityFilter.frequency.setValueAtTime(880, now);
      purityFilter.connect(destGain);

      // Breath modulation for celestial white light flow
      if (context instanceof AudioContext) {
        const lfo = context.createOscillator();
        const lfoGain = context.createGain();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.065, now); // ~15.4 seconds slow wave
        lfoGain.gain.setValueAtTime(160, now);
        lfo.connect(lfoGain);
        lfoGain.connect(purityFilter.frequency);
        lfo.start(now);
        this.activeNodes.push(lfo, lfoGain);
      }

      frequencies.forEach((freq, idx) => {
        const osc = context.createOscillator();
        const oscGain = context.createGain();

        // Sine wave for pure 741Hz tone, soft triangle for low root
        osc.type = freq === 741 ? "sine" : idx === 0 ? "sine" : "triangle";
        const detune = (idx - 1.5) * 3;
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);

        const amp = freq === 741 ? 0.32 : 0.22 / Math.sqrt(idx + 1);
        oscGain.gain.setValueAtTime(amp, now);

        osc.connect(oscGain);
        oscGain.connect(purityFilter);
        osc.start(now);
        this.activeNodes.push(osc, oscGain);
      });

      // Angelic crystal chime every 20 seconds at 741 Hz
      if (context instanceof AudioContext) {
        this.intervalChimeTimer = setInterval(() => {
          if (this.isPlaying) {
            this.playSingingBowlChime(741, 0.1);
          }
        }, 20000);
      }
    }
  }

  /**
   * Play user uploaded custom meditation audio
   */
  private playCustomBuffer(context: BaseAudioContext, destGain: GainNode) {
    if (!this.customBuffer) return;

    const source = context.createBufferSource();
    source.buffer = this.customBuffer;
    source.loop = true;
    source.connect(destGain);
    source.start(context.currentTime);

    if (context instanceof AudioContext) {
      this.customBufferSource = source;
    }
    this.activeNodes.push(source);
  }

  /**
   * Load custom meditation track from user local file
   */
  public async loadCustomAudioFile(file: File): Promise<string> {
    this.initContext();
    if (!this.ctx) throw new Error("AudioContext no inicializado");

    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.ctx.decodeAudioData(arrayBuffer);

    this.customBuffer = decoded;
    this.customFileName = file.name;
    this.currentTrack = "custom";
    this.notify();

    return file.name;
  }

  /**
   * Play sacred singing bowl bell (528Hz or 432Hz)
   */
  public playSingingBowlChime(freq = 528, volume = 0.18) {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq - 2, now + 4.5);

    // Overtone harmonic (approx 2.76x of fundamental frequency in singing bowls)
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(freq * 2.76, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 4.9);
    overtone.stop(now + 4.9);
  }

  /**
   * Render voice + meditation music together into a single offline-rendered WAV Blob!
   */
  public async renderMixedWav(
    voiceAudioUrl: string,
    trackId: MeditationTrackId = this.currentTrack,
    voiceVol = 1.0,
    musicVol = this.musicVolume
  ): Promise<Blob> {
    // 1. Fetch & decode voice audio
    const res = await fetch(voiceAudioUrl);
    const voiceArrayBuffer = await res.arrayBuffer();

    const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const voiceAudioBuffer = await tempCtx.decodeAudioData(voiceArrayBuffer);
    await tempCtx.close();

    const duration = voiceAudioBuffer.duration + 2.5; // Include gentle fade out
    const sampleRate = 44100;
    const numChannels = 2; // Stereo master for deep spacious meditation music
    const length = Math.ceil(duration * sampleRate);

    // 2. Setup OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);

    // 3. Connect Voice
    const voiceSource = offlineCtx.createBufferSource();
    voiceSource.buffer = voiceAudioBuffer;
    const voiceGain = offlineCtx.createGain();
    voiceGain.gain.setValueAtTime(voiceVol, 0);
    voiceSource.connect(voiceGain);
    voiceGain.connect(offlineCtx.destination);
    voiceSource.start(0);

    // 4. Connect Meditation Music
    const musicGain = offlineCtx.createGain();
    // Smooth fade in & out
    musicGain.gain.setValueAtTime(0.001, 0);
    musicGain.gain.exponentialRampToValueAtTime(Math.max(0.01, musicVol * 0.9), 2);
    musicGain.gain.setValueAtTime(Math.max(0.01, musicVol * 0.9), Math.max(2, duration - 3));
    musicGain.gain.exponentialRampToValueAtTime(0.0001, duration);
    musicGain.connect(offlineCtx.destination);

    if (trackId === "custom" && this.customBuffer) {
      const customSource = offlineCtx.createBufferSource();
      customSource.buffer = this.customBuffer;
      customSource.loop = true;
      customSource.connect(musicGain);
      customSource.start(0);
    } else {
      this.synthesizeSoundscape(offlineCtx, musicGain, trackId);
    }

    // 5. Render to AudioBuffer and convert to WAV Blob
    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(renderedBuffer);
  }
}

export const ambientSound = new AmbientSoundEngine();
