import React, { useState, useEffect, useRef } from "react";
import { Archangel, AdvancedAudioSettings } from "../types";
import { ambientSound } from "../utils/ambientAudio";
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
} from "lucide-react";

interface AudioPlayerProps {
  arcangel: Archangel;
  settings: AdvancedAudioSettings;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ arcangel, settings }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState<boolean>(false);
  const [selectedBackground, setSelectedBackground] = useState<"recomendado" | "alterno">("recomendado");
  const [activeFrequencyHz, setActiveFrequencyHz] = useState<number>(
    arcangel.pestaña_1_altar.canal2_hz_base
  );

  // HTML Audio element refs for dual-channel audio
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio cache for studio voices
  const ttsAudioCache = useRef<Record<string, string>>({});

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

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.001, volume * 0.25),
        ctx.currentTime + 1.5
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
        synthGainRef.current.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
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
        }, 850);
      } catch {
        // ignore
      }
    }
  };

  // Setup dual audio channels when Arcángel or frequency track changes
  useEffect(() => {
    // Pause previous audio
    if (voiceAudioRef.current) voiceAudioRef.current.pause();
    if (ambientAudioRef.current) ambientAudioRef.current.pause();
    browserTts.stop();
    window.speechSynthesis?.cancel();
    stopSacredOscillator();

    // Canal 2: Frecuencia de Fondo
    let ambientUrl = `/audio/frecuencias/${arcangel.pestaña_1_altar.canal2_audio_url_recommended || "ambient.mp3"}`;
    if (selectedBackground === "alterno") {
      ambientUrl = `/audio/frecuencias/${arcangel.pestaña_1_altar.canal2_audio_url_alterno || "ambient.mp3"}`;
    }

    ambientAudioRef.current = new Audio(ambientUrl);
    ambientAudioRef.current.loop = true;
    ambientAudioRef.current.volume = settings.ambientVolume;

    // If already playing, resume with the new Arcangel
    if (isPlaying) {
      playSacredPrayer();
      ambientAudioRef.current
        .play()
        .catch(() => {
          startSacredOscillator(activeFrequencyHz, settings.ambientVolume);
        });
    }

    return () => {
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      if (ambientAudioRef.current) ambientAudioRef.current.pause();
      browserTts.stop();
      window.speechSynthesis?.cancel();
      stopSacredOscillator();
    };
  }, [arcangel, selectedBackground]);

  // Handle Speech Synthesis with 100% Latin American Female Voice & Sacred Pauses
  const playBrowserFemaleSpeech = () => {
    browserTts.stop();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    // If segments exist, play with reverent pauses
    if (arcangel.pestaña_1_altar.segments && arcangel.pestaña_1_altar.segments.length > 0) {
      browserTts.playPrayer(
        arcangel.pestaña_1_altar.segments,
        {
          onSegmentChange: () => {},
          onEnded: () => {
            if (!settings.infiniteLoopAmbient) {
              setIsPlaying(false);
              stopSacredOscillator();
              if (ambientAudioRef.current) ambientAudioRef.current.pause();
            }
          },
          onError: () => {
            setIsPlaying(false);
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
      utterance.pitch = settings.voicePitch ?? 1.15; // Distinctive feminine warm pitch
      utterance.rate = settings.voiceSpeed ?? 0.85;   // Contemplative cadence
      utterance.volume = settings.voiceVolume;

      utterance.onend = () => {
        if (!settings.infiniteLoopAmbient) {
          setIsPlaying(false);
          stopSacredOscillator();
          if (ambientAudioRef.current) ambientAudioRef.current.pause();
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  // Play prayer with selected Latin Female voice (Studio Aoede/Kore or Browser Female)
  const playSacredPrayer = async () => {
    const voiceType = settings.femaleVoiceType || "gemini_aoede";

    // If browser female voice requested, run immediately
    if (voiceType === "browser_female") {
      playBrowserFemaleSpeech();
      return;
    }

    // Try studio Gemini female voice (Aoede, Kore, or Zephyr)
    const geminiVoiceName =
      voiceType === "gemini_kore"
        ? "Kore"
        : voiceType === "gemini_zephyr"
        ? "Zephyr"
        : "Aoede";
    const cacheKey = `${arcangel.id}-${geminiVoiceName}`;

    if (ttsAudioCache.current[cacheKey]) {
      const audioUrl = ttsAudioCache.current[cacheKey];
      voiceAudioRef.current = new Audio(audioUrl);
      voiceAudioRef.current.volume = settings.voiceVolume;
      voiceAudioRef.current.onended = () => {
        if (!settings.infiniteLoopAmbient) {
          setIsPlaying(false);
          stopSacredOscillator();
          if (ambientAudioRef.current) ambientAudioRef.current.pause();
        }
      };
      voiceAudioRef.current.play().catch(() => playBrowserFemaleSpeech());
      return;
    }

    // Fetch from backend with seamless fallback to browser female voice
    setIsLoadingVoice(true);
    try {
      const res = await fetch("/api/tts/generate-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: arcangel.pestaña_1_altar.oracion_texto,
          voice: geminiVoiceName,
        }),
      });

      if (!res.ok) {
        throw new Error("TTS API unavailable");
      }

      const data = await res.json();
      if (data.success && data.audioUrl) {
        ttsAudioCache.current[cacheKey] = data.audioUrl;
        voiceAudioRef.current = new Audio(data.audioUrl);
        voiceAudioRef.current.volume = settings.voiceVolume;
        voiceAudioRef.current.onended = () => {
          if (!settings.infiniteLoopAmbient) {
            setIsPlaying(false);
            stopSacredOscillator();
            if (ambientAudioRef.current) ambientAudioRef.current.pause();
          }
        };
        await voiceAudioRef.current.play();
      } else {
        throw new Error("No audio returned");
      }
    } catch (err) {
      // Gracefully fall back to the browser's Latin American female voice
      playBrowserFemaleSpeech();
    } finally {
      setIsLoadingVoice(false);
    }
  };

  // Real-time Ducking and Volume Adjustments
  useEffect(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.volume = settings.voiceVolume;
    }

    // Audio Ducking logic: reduce background volume when voice is playing
    const effectiveAmbientVol =
      settings.audioDucking && isPlaying
        ? settings.ambientVolume * 0.4
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
  }, [settings, isPlaying]);

  // Main PLAY / PAUSE Handler
  const togglePlayback = () => {
    if (isPlaying) {
      if (voiceAudioRef.current) voiceAudioRef.current.pause();
      if (ambientAudioRef.current) ambientAudioRef.current.pause();
      browserTts.stop();
      window.speechSynthesis?.cancel();
      stopSacredOscillator();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);

      // Start Channel 1 (Voz Latina Femenina)
      playSacredPrayer();

      // Start Channel 2 (Ambient Hz)
      if (ambientAudioRef.current) {
        ambientAudioRef.current
          .play()
          .catch(() => {
            startSacredOscillator(activeFrequencyHz, settings.ambientVolume);
          });
      }
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

      {/* 🌸 INDICADOR DE VOZ NARRADORA FEMENINA LATINA */}
      <div className="mb-5 z-10 flex items-center space-x-2 bg-neutral-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-neutral-800 text-xs text-neutral-300 shadow-sm">
        <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 shrink-0" />
        <span className="text-neutral-400">Voz Narradora:</span>
        <span className="text-pink-300 font-semibold">{voiceLabel}</span>
      </div>

      {/* 🎛️ SELECTOR DE PAISAJES SONOROS DE MEDITACIÓN (CANAL 2) */}
      <div className="w-full bg-neutral-900/85 backdrop-blur-md p-4 rounded-2xl border border-neutral-800 mb-6 z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>Canal 2 • Frecuencias Sagradas de Meditación</span>
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

      <p className="text-xs text-neutral-400 mt-3 z-10">
        {isPlaying
          ? "Reproduciendo Oración Suprema con Voz Latina Femenina"
          : isLoadingVoice
          ? "Preparando voz de oración…"
          : "Toca para iniciar la invocación sagrada"}
      </p>

      {/* Caja de Texto Desplegable con la Oración Suprema */}
      <div className="mt-6 text-neutral-300 text-xs sm:text-sm text-center italic bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800/80 max-h-32 overflow-y-auto leading-relaxed z-10 font-serif">
        "{arcangel.pestaña_1_altar.oracion_texto}"
      </div>
    </div>
  );
};
