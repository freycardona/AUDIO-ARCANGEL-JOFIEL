import React, { useState, useEffect, useRef } from "react";
import { Archangel, AdvancedAudioSettings } from "../types";
import { browserTts, getBestLatinFemaleVoice } from "../utils/browserTts";
import {
  Play,
  Pause,
  Volume2,
  Waves,
  Sparkles,
  RefreshCw,
  Radio,
  Heart,
  Mic,
  VolumeX,
  Headphones,
} from "lucide-react";

interface AudioPlayerProps {
  arcangel: Archangel;
  settings: AdvancedAudioSettings;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ arcangel, settings }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState<boolean>(false);
  const [selectedBackground, setSelectedBackground] = useState<"recomendado" | "alterno">("recomendado");
  const [activeFrequencyHz, setActiveFrequencyHz] = useState<number>(
    arcangel.pestaña_1_altar.canal2_hz_base
  );

  // HTML Audio element refs for dual-channel audio
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio synth fallback oscillator for 100% guaranteed real Hz sound
  const synthCtxRef = useRef<AudioContext | null>(null);
  const synthOscRef = useRef<OscillatorNode | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);

  // Update selected frequency when changing arcangel or background mode
  useEffect(() => {
    const targetHz =
      selectedBackground === "alterno"
        ? arcangel.pestaña_1_altar.canal2_hz_alterno
        : arcangel.pestaña_1_altar.canal2_hz_base;
    setActiveFrequencyHz(targetHz);
  }, [arcangel, selectedBackground]);

  // Audio synthesis helper for pure sacred frequencies
  const startSacredOscillator = (hz: number, volume: number) => {
    try {
      if (!synthCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        synthCtxRef.current = new AudioCtx();
      }
      if (synthCtxRef.current.state === "suspended") {
        synthCtxRef.current.resume();
      }

      if (synthOscRef.current) {
        try {
          synthOscRef.current.stop();
          synthOscRef.current.disconnect();
        } catch {
          // ignore
        }
      }

      const ctx = synthCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Warm pure sine wave
      osc.type = "sine";
      osc.frequency.setValueAtTime(hz, ctx.currentTime);

      // Soft lowpass for gentle angelic meditation
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, volume * 0.25),
        ctx.currentTime + 1.2
      );

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      synthOscRef.current = osc;
      synthGainRef.current = gain;
    } catch (e) {
      console.warn("Sacred frequency synth notice:", e);
    }
  };

  const stopSacredOscillator = () => {
    if (synthGainRef.current && synthCtxRef.current) {
      try {
        const ctx = synthCtxRef.current;
        synthGainRef.current.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        setTimeout(() => {
          if (synthOscRef.current) {
            try {
              synthOscRef.current.stop();
              synthOscRef.current.disconnect();
            } catch {
              // ignore
            }
            synthOscRef.current = null;
          }
        }, 550);
      } catch {
        // ignore
      }
    }
  };

  // Browser speech synthesis fallback with 100% Latin female voice
  const playBrowserFemaleSpeech = () => {
    browserTts.stop();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    setIsVoicePlaying(true);

    if (arcangel.pestaña_1_altar.segments && arcangel.pestaña_1_altar.segments.length > 0) {
      browserTts.playPrayer(
        arcangel.pestaña_1_altar.segments,
        {
          onSegmentChange: () => {},
          onEnded: () => {
            setIsVoicePlaying(false);
            if (!settings.infiniteLoopAmbient) {
              setIsPlaying(false);
              stopSacredOscillator();
              if (ambientAudioRef.current) ambientAudioRef.current.pause();
            }
          },
          onError: () => {
            setIsVoicePlaying(false);
          },
        },
        {
          preferredVoiceName: settings.browserVoiceName,
          pitch: settings.voicePitch ?? 1.15,
          rate: settings.voiceSpeed ?? 0.85,
          volume: settings.voiceVolume,
        }
      );
    } else {
      const utterance = new SpeechSynthesisUtterance(arcangel.pestaña_1_altar.oracion_texto);
      const femaleVoice = getBestLatinFemaleVoice(settings.browserVoiceName);
      if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.lang = femaleVoice.lang || "es-419";
      } else {
        utterance.lang = "es-419";
      }
      utterance.pitch = settings.voicePitch ?? 1.15;
      utterance.rate = settings.voiceSpeed ?? 0.85;
      utterance.volume = settings.voiceVolume;

      utterance.onend = () => {
        setIsVoicePlaying(false);
        if (!settings.infiniteLoopAmbient) {
          setIsPlaying(false);
          stopSacredOscillator();
          if (ambientAudioRef.current) ambientAudioRef.current.pause();
        }
      };

      utterance.onerror = () => {
        setIsVoicePlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAllAudio = () => {
    if (voiceAudioRef.current) {
      try {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
      } catch {}
    }
    if (ambientAudioRef.current) {
      try {
        ambientAudioRef.current.pause();
      } catch {}
    }
    browserTts.stop();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    stopSacredOscillator();
    setIsVoicePlaying(false);
  };

  // Get current prayer audio URL
  const getPrayerAudioUrl = () => {
    return arcangel.pestaña_1_altar.canal1_audio_url || `/audio/oracion_${arcangel.id}.mp3`;
  };

  // Preload and attach audio sources whenever Arcangel or background track changes
  useEffect(() => {
    stopAllAudio();
    setIsPlaying(false);

    // 1. Canal 1 - Oración Voz Sagrada
    if (voiceAudioRef.current) {
      const prayerUrl = getPrayerAudioUrl();
      voiceAudioRef.current.src = prayerUrl;
      voiceAudioRef.current.preload = "auto";
      voiceAudioRef.current.volume = settings.voiceVolume;
      voiceAudioRef.current.load();
    }

    // 2. Canal 2 - Frecuencia Sagrada
    if (ambientAudioRef.current) {
      const ambTrack =
        selectedBackground === "alterno"
          ? arcangel.pestaña_1_altar.canal2_audio_url_alterno
          : arcangel.pestaña_1_altar.canal2_audio_url_recommended || "ambient.mp3";
      ambientAudioRef.current.src = `/audio/frecuencias/${ambTrack}`;
      ambientAudioRef.current.preload = "auto";
      ambientAudioRef.current.loop = true;
      ambientAudioRef.current.volume = settings.ambientVolume;
      ambientAudioRef.current.load();
    }

    return () => {
      stopAllAudio();
    };
  }, [arcangel, selectedBackground]);

  // Adjust volumes in real time (including ducking)
  useEffect(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.volume = settings.voiceVolume;
    }

    const effectiveAmbientVol =
      settings.audioDucking && isVoicePlaying
        ? settings.ambientVolume * 0.35
        : settings.ambientVolume;

    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = effectiveAmbientVol;
    }

    if (synthGainRef.current && synthCtxRef.current) {
      synthGainRef.current.gain.setValueAtTime(
        Math.max(0.001, effectiveAmbientVol * 0.25),
        synthCtxRef.current.currentTime
      );
    }
  }, [settings.voiceVolume, settings.ambientVolume, settings.audioDucking, isVoicePlaying]);

  // Start Voice Channel directly
  const startVoicePlayback = () => {
    if (settings.femaleVoiceType === "browser_female") {
      playBrowserFemaleSpeech();
      return;
    }

    if (voiceAudioRef.current) {
      const v = voiceAudioRef.current;
      v.currentTime = 0;
      v.volume = settings.voiceVolume;
      setIsVoicePlaying(true);
      const promise = v.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn("Direct HTML5 voice audio play error, switching to device TTS:", err);
          playBrowserFemaleSpeech();
        });
      }
    } else {
      playBrowserFemaleSpeech();
    }
  };

  // Start Ambient Frequency Channel directly
  const startAmbientPlayback = () => {
    const effectiveAmbientVol =
      settings.audioDucking ? settings.ambientVolume * 0.35 : settings.ambientVolume;

    if (ambientAudioRef.current) {
      const a = ambientAudioRef.current;
      a.volume = effectiveAmbientVol;
      const promise = a.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // If browser blocks audio element file, fallback to Web Audio oscillator
          startSacredOscillator(activeFrequencyHz, effectiveAmbientVol);
        });
      }
    } else {
      startSacredOscillator(activeFrequencyHz, effectiveAmbientVol);
    }
  };

  // Main PLAY / PAUSE Handler
  const togglePlayback = () => {
    if (isPlaying) {
      stopAllAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);

      // Unpause speech synthesis if suspended by browser
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }

      // Resume AudioContext within click handler to unlock browser permissions
      if (synthCtxRef.current && synthCtxRef.current.state === "suspended") {
        synthCtxRef.current.resume();
      }

      // 1. INICIAR CANAL 1: VOZ DE LA ORACIÓN SAGRADA
      startVoicePlayback();

      // 2. INICIAR CANAL 2: FRECUENCIA SOLFEGGIO DE FONDO
      startAmbientPlayback();
    }
  };

  // Individual test button for voice
  const handleTestVoiceOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVoicePlaying) {
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsVoicePlaying(false);
    } else {
      startVoicePlayback();
    }
  };

  // Cosmic Ray Glow Intensity
  const glowOpacity =
    settings.visualIntensity === "low"
      ? 0.15
      : settings.visualIntensity === "high"
      ? 0.45
      : 0.28;

  // Active female voice display name
  const voiceLabel =
    settings.femaleVoiceType === "gemini_kore"
      ? "Kore (Latina Mística)"
      : settings.femaleVoiceType === "browser_female"
      ? `Nativa (${settings.browserVoiceName || getBestLatinFemaleVoice()?.name || "Latina"})`
      : "Aoede (Latina Serena)";

  return (
    <div
      id="audio-player-altar"
      className="flex flex-col items-center justify-center p-6 sm:p-7 bg-neutral-950 rounded-3xl max-w-xl mx-auto border border-neutral-900 shadow-2xl relative overflow-hidden transition-all"
    >
      {/* Dynamic Cosmic Ray Ambient Glow */}
      <div
        className="absolute -top-12 -right-12 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: arcangel.colorHex,
          opacity: glowOpacity,
        }}
      />
      <div
        className="absolute -bottom-12 -left-12 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: arcangel.colorHex,
          opacity: glowOpacity * 0.7,
        }}
      />

      {/* 🖼️ IMAGEN DEL ARCÁNGEL AUTOMÁTICA CON EFECTO DE RAYO */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden mb-6 shadow-2xl border border-neutral-800 group z-10">
        <img
          src={`/assets/imagenes/${arcangel.imagen}.png`}
          alt={arcangel.nombre}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80";
          }}
        />

        {/* Capa de color ambiental según el rayo del Arcángel */}
        <div
          className="absolute inset-0 pointer-events-none mix-blend-color transition-opacity duration-500"
          style={{
            backgroundColor: arcangel.colorHex,
            opacity: settings.visualIntensity === "high" ? 0.35 : 0.2,
          }}
        />

        {/* Halo Pulsante si el audio está en reproducción */}
        {isPlaying && (
          <div
            className="absolute inset-0 border-2 rounded-3xl animate-pulse pointer-events-none"
            style={{ borderColor: arcangel.colorHex }}
          />
        )}

        {/* Badge Flotante del Día y Frecuencia */}
        <div className="absolute top-3 right-3 bg-neutral-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-700/80 text-[11px] font-semibold text-white flex items-center space-x-1.5 shadow-lg">
          <Waves className="w-3 h-3 text-amber-400" />
          <span>{activeFrequencyHz} Hz</span>
        </div>
      </div>

      {/* Título e Información Básica en Pantalla */}
      <div className="text-center mb-4 z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-semibold mb-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: arcangel.colorHex }}
          />
          <span className="text-neutral-300">
            Día {arcangel.dia} • {arcangel.ray}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sacred">
          {arcangel.nombre}
        </h1>
        <p className="text-xs sm:text-sm font-medium mt-1" style={{ color: arcangel.colorHex }}>
          {arcangel.significado}
        </p>
      </div>

      {/* 🌸 MONITOR DE CANALES DE AUDIO (VOZ Y FRECUENCIA) */}
      <div className="w-full grid grid-cols-2 gap-2 mb-4 z-10 text-[11px]">
        {/* Canal 1: Voz Sagrada */}
        <div
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all ${
            isVoicePlaying
              ? "bg-pink-950/40 border-pink-500/50 text-pink-200"
              : "bg-neutral-900/60 border-neutral-800 text-neutral-400"
          }`}
        >
          <Mic className={`w-3.5 h-3.5 ${isVoicePlaying ? "text-pink-400 animate-pulse" : "text-neutral-500"}`} />
          <div className="truncate">
            <span className="font-semibold block text-[10px] uppercase tracking-wider text-pink-400">Canal 1: Voz</span>
            <span className="truncate">{isVoicePlaying ? "Locución Activa" : "Voz Preparada"}</span>
          </div>
        </div>

        {/* Canal 2: Frecuencia Solfeggio */}
        <div
          className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition-all ${
            isPlaying
              ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
              : "bg-neutral-900/60 border-neutral-800 text-neutral-400"
          }`}
        >
          <Waves className={`w-3.5 h-3.5 ${isPlaying ? "text-amber-400 animate-pulse" : "text-neutral-500"}`} />
          <div className="truncate">
            <span className="font-semibold block text-[10px] uppercase tracking-wider text-amber-400">Canal 2: Solfeggio</span>
            <span className="truncate">{isPlaying ? `${activeFrequencyHz} Hz Sonando` : `${activeFrequencyHz} Hz Listo`}</span>
          </div>
        </div>
      </div>

      {/* 🎛️ SELECTOR DE PAISAJES SONOROS DE MEDITACIÓN (CANAL 2) */}
      <div className="w-full bg-neutral-900/85 backdrop-blur-md p-4 rounded-2xl border border-neutral-800 mb-6 z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Frecuencias Sagradas de Meditación</span>
          </p>
          <span className="text-[11px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-md">
            {activeFrequencyHz} Hz
          </span>
        </div>

        <div className="space-y-2.5">
          <label
            className={`flex items-center space-x-3 text-xs sm:text-sm p-2.5 rounded-xl cursor-pointer transition-all border ${
              selectedBackground === "recomendado"
                ? "bg-neutral-800/90 border-amber-400/50 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <input
              type="radio"
              name="backgroundHz"
              checked={selectedBackground === "recomendado"}
              onChange={() => setSelectedBackground("recomendado")}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
            <span className="flex-1 font-medium">
              Frecuencia Nativa: {arcangel.pestaña_1_altar.canal2_frecuencia_recommended}
            </span>
          </label>

          <label
            className={`flex items-center space-x-3 text-xs sm:text-sm p-2.5 rounded-xl cursor-pointer transition-all border ${
              selectedBackground === "alterno"
                ? "bg-neutral-800/90 border-amber-400/50 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <input
              type="radio"
              name="backgroundHz"
              checked={selectedBackground === "alterno"}
              onChange={() => setSelectedBackground("alterno")}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
            <span className="flex-1 font-medium">
              Frecuencia Alterna: {arcangel.pestaña_1_altar.canal2_opcion_alterna_hz}
            </span>
          </label>
        </div>
      </div>

      {/* 🔮 BOTÓN DE PLAY / PAUSE PRINCIPAL */}
      <button
        type="button"
        id="btn-play-pause-arcangel"
        onClick={togglePlayback}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl z-10 relative group"
        style={{
          backgroundColor: arcangel.colorHex,
          boxShadow: `0 0 35px ${arcangel.colorHex}66`,
        }}
        title={isPlaying ? "Pausar Oración" : "Escuchar Oración con Frecuencia"}
      >
        {isPlaying ? (
          <Pause className="w-9 h-9 sm:w-10 sm:h-10 text-neutral-950 fill-neutral-950" />
        ) : (
          <Play className="w-9 h-9 sm:w-10 sm:h-10 text-neutral-950 fill-neutral-950 ml-1.5" />
        )}
      </button>

      <p className="text-xs text-neutral-400 mt-3 z-10 text-center">
        {isPlaying ? (
          <span className="text-emerald-400 font-medium flex items-center justify-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Reproduciendo Oración Suprema con Frecuencia Sagrada</span>
          </span>
        ) : (
          "Toca para iniciar la invocación sagrada (Voz + Frecuencia)"
        )}
      </p>

      {/* DOM audio elements explicitly wired with auto preload and onended listeners */}
      <audio
        ref={voiceAudioRef}
        id="sacred-prayer-audio-element"
        preload="auto"
        className="hidden"
        onPlay={() => setIsVoicePlaying(true)}
        onPause={() => setIsVoicePlaying(false)}
        onEnded={() => {
          setIsVoicePlaying(false);
          if (!settings.infiniteLoopAmbient) {
            setIsPlaying(false);
            if (ambientAudioRef.current) ambientAudioRef.current.pause();
            stopSacredOscillator();
          } else {
            // Restore ambient volume to full
            if (ambientAudioRef.current) {
              ambientAudioRef.current.volume = settings.ambientVolume;
            }
          }
        }}
        onError={() => {
          console.warn("Voice audio element error, initiating fallback to Web Speech");
          setIsVoicePlaying(false);
          if (isPlaying) {
            playBrowserFemaleSpeech();
          }
        }}
      />
      <audio
        ref={ambientAudioRef}
        id="sacred-ambient-audio-element"
        preload="auto"
        loop
        className="hidden"
      />

      {/* Caja de Texto Desplegable con la Oración Suprema */}
      <div className="mt-6 w-full text-neutral-300 text-xs sm:text-sm bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/80 z-10 font-serif">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1">
            <Heart className="w-3 h-3 text-pink-400" />
            <span>Texto de la Oración Suprema</span>
          </span>
          <button
            type="button"
            onClick={handleTestVoiceOnly}
            className="text-[11px] font-sans text-pink-300 hover:text-pink-200 bg-pink-950/60 hover:bg-pink-900/60 border border-pink-800/60 px-2.5 py-1 rounded-full flex items-center space-x-1 transition-all"
            title="Escuchar locución de la oración en solitario"
          >
            <Mic className="w-3 h-3" />
            <span>{isVoicePlaying ? "Pausar Voz" : "Solo Voz"}</span>
          </button>
        </div>
        <p className="italic text-center leading-relaxed max-h-32 overflow-y-auto">
          "{arcangel.pestaña_1_altar.oracion_texto}"
        </p>
      </div>
    </div>
  );
};
