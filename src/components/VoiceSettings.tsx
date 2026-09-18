import React, { useState, useEffect } from "react";
import { AdvancedAudioSettings } from "../types";
import {
  Mic,
  Volume2,
  Waves,
  Sliders,
  Moon,
  Sparkles,
  RefreshCw,
  User,
  Heart,
  PlayCircle,
  Check,
} from "lucide-react";
import {
  getAvailableFemaleLatinVoices,
  speakSampleFemaleVoice,
  getBestLatinFemaleVoice,
  isNaturalVoice,
} from "../utils/browserTts";

interface VoiceSettingsProps {
  settings: AdvancedAudioSettings;
  onSettingsChange: (settings: AdvancedAudioSettings) => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const [deviceVoices, setDeviceVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

  useEffect(() => {
    const loadVoices = () => {
      const v = getAvailableFemaleLatinVoices();
      setDeviceVoices(v);
    };
    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      };
    }
  }, []);

  const handleToggle = (key: keyof AdvancedAudioSettings) => {
    const updated = { ...settings, [key]: !settings[key] as any };
    onSettingsChange(updated);
  };

  const handleSlider = (
    key: "voiceVolume" | "ambientVolume" | "voicePitch" | "voiceSpeed",
    value: number
  ) => {
    const updated = { ...settings, [key]: value };
    onSettingsChange(updated);
  };

  const handleIntensity = (intensity: "low" | "medium" | "high") => {
    const updated = { ...settings, visualIntensity: intensity };
    onSettingsChange(updated);
  };

  const handleVoiceType = (
    type: "gemini_aoede" | "gemini_kore" | "gemini_zephyr" | "browser_female"
  ) => {
    const updated = { ...settings, femaleVoiceType: type };
    onSettingsChange(updated);
  };

  const handleBrowserVoiceSelect = (voiceName: string) => {
    const updated = { ...settings, browserVoiceName: voiceName };
    onSettingsChange(updated);
  };

  const testFemaleVoice = async () => {
    if (isPreviewPlaying) return;
    setIsPreviewPlaying(true);

    if (settings.femaleVoiceType === "browser_female") {
      speakSampleFemaleVoice(
        settings.browserVoiceName,
        settings.voicePitch || 1.15,
        settings.voiceSpeed || 0.85
      );
      setTimeout(() => setIsPreviewPlaying(false), 3500);
      return;
    }

    try {
      const voiceName =
        settings.femaleVoiceType === "gemini_kore"
          ? "Kore"
          : settings.femaleVoiceType === "gemini_zephyr"
          ? "Zephyr"
          : "Aoede";

      const res = await fetch("/api/tts/preview-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: voiceName }),
      });
      const data = await res.json();
      if (data.success && data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.volume = settings.voiceVolume || 0.9;
        audio.onended = () => setIsPreviewPlaying(false);
        audio.onerror = () => {
          speakSampleFemaleVoice(settings.browserVoiceName);
          setIsPreviewPlaying(false);
        };
        await audio.play();
      } else {
        speakSampleFemaleVoice(settings.browserVoiceName);
        setTimeout(() => setIsPreviewPlaying(false), 3500);
      }
    } catch {
      speakSampleFemaleVoice(settings.browserVoiceName);
      setTimeout(() => setIsPreviewPlaying(false), 3500);
    }
  };

  return (
    <div
      id="voice-settings-panel"
      className="bg-neutral-950 text-white p-6 sm:p-7 rounded-3xl max-w-xl mx-auto shadow-2xl border border-neutral-800 transition-all"
    >
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-300 tracking-wide font-sacred">
              Configuración de Audio y Narración
            </h2>
            <p className="text-xs text-neutral-400">
              Voz latina femenina, mezcla de canales y frecuencias sagradas
            </p>
          </div>
        </div>
      </div>

      {/* 🌸 SECCIÓN DE VOZ FEMENINA LATINA */}
      <div className="bg-neutral-900/90 p-5 rounded-2xl border border-amber-500/20 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-400/30">
              <Heart className="w-4 h-4 fill-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Voz Narradora Femenina Latina
              </h3>
              <p className="text-[11px] text-neutral-400">
                Tono dulce, solemne y maternal con acento latinoamericano
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={testFemaleVoice}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-400/40 text-pink-300 text-xs font-semibold transition-all active:scale-95 shadow-sm"
            title="Escuchar muestra de voz femenina"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>{isPreviewPlaying ? "Hablando…" : "Probar Voz"}</span>
          </button>
        </div>

        {/* Opciones de Voz Femenina */}
        <div className="space-y-2.5">
          {/* Opción 1: Aoede (Gemini) */}
          <div
            onClick={() => handleVoiceType("gemini_aoede")}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
              settings.femaleVoiceType === "gemini_aoede"
                ? "bg-amber-950/40 border-amber-400 text-white shadow-md shadow-amber-950/30"
                : "bg-neutral-950/50 border-neutral-800 text-neutral-300 hover:border-neutral-700"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                settings.femaleVoiceType === "gemini_aoede"
                  ? "border-amber-400 bg-amber-500"
                  : "border-neutral-600"
              }`}
            >
              {settings.femaleVoiceType === "gemini_aoede" && (
                <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-amber-200">
                  Aoede • Locutora Latina Serena
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  Recomendada
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Voz femenina cálida, dulce y maternal con cadencia latina neutra, pausada y reconfortante.
              </p>
            </div>
          </div>

          {/* Opción 2: Kore (Gemini) */}
          <div
            onClick={() => handleVoiceType("gemini_kore")}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
              settings.femaleVoiceType === "gemini_kore"
                ? "bg-amber-950/40 border-amber-400 text-white shadow-md shadow-amber-950/30"
                : "bg-neutral-950/50 border-neutral-800 text-neutral-300 hover:border-neutral-700"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                settings.femaleVoiceType === "gemini_kore"
                  ? "border-amber-400 bg-amber-500"
                  : "border-neutral-600"
              }`}
            >
              {settings.femaleVoiceType === "gemini_kore" && (
                <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-amber-200">
                  Kore • Locutora Latina Mística
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                  Mística
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Voz suave, íntima y de intensidad baja, ideal para la oración profunda y contemplativa.
              </p>
            </div>
          </div>

          {/* Opción 3: Zephyr (Gemini) */}
          <div
            onClick={() => handleVoiceType("gemini_zephyr")}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
              settings.femaleVoiceType === "gemini_zephyr"
                ? "bg-amber-950/40 border-amber-400 text-white shadow-md shadow-amber-950/30"
                : "bg-neutral-950/50 border-neutral-800 text-neutral-300 hover:border-neutral-700"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                settings.femaleVoiceType === "gemini_zephyr"
                  ? "border-amber-400 bg-amber-500"
                  : "border-neutral-600"
              }`}
            >
              {settings.femaleVoiceType === "gemini_zephyr" && (
                <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-amber-200">
                  Zephyr • Locutora Celestial y Cristalina
                </span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-mono">
                  Celestial
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Voz femenina luminosa, pura y diáfana, con cadencia suave y articulación armónica.
              </p>
            </div>
          </div>

          {/* Opción 4: Voz Latina del Dispositivo */}
          <div
            onClick={() => handleVoiceType("browser_female")}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
              settings.femaleVoiceType === "browser_female"
                ? "bg-amber-950/40 border-amber-400 text-white shadow-md shadow-amber-950/30"
                : "bg-neutral-950/50 border-neutral-800 text-neutral-300 hover:border-neutral-700"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                settings.femaleVoiceType === "browser_female"
                  ? "border-amber-400 bg-amber-500"
                  : "border-neutral-600"
              }`}
            >
              {settings.femaleVoiceType === "browser_female" && (
                <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-amber-200">
                  Voz Latina del Dispositivo / Navegador
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  Local
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Utiliza las voces instaladas en tu equipo (se recomiendan las marcadas con 🌿 Natural/Online).
              </p>

              {/* Selector desplegable de voces del sistema si hay más de una */}
              {deviceVoices.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-neutral-800">
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    Seleccionar voz instalada:
                  </label>
                  <select
                    value={settings.browserVoiceName || ""}
                    onChange={(e) => handleBrowserVoiceSelect(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 rounded-lg p-2 focus:ring-1 focus:ring-amber-400 outline-none"
                  >
                    <option value="">
                      Automática recomendada:{" "}
                      {getBestLatinFemaleVoice()?.name || "Voz Femenina"}
                    </option>
                    {deviceVoices.map((v) => {
                      const natural = isNaturalVoice(v);
                      return (
                        <option key={v.name} value={v.name}>
                          {natural ? "🌿 [Natural/Online] " : ""}{v.name} ({v.lang})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ajustes de Tono y Cadencia de la Voz Femenina */}
        <div className="mt-4 pt-4 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs text-neutral-300 mb-1.5 font-medium">
              <span>Tono Femenino (Calidez)</span>
              <span className="text-amber-400 font-mono">
                {((settings.voicePitch ?? 1.15) > 1.15 ? "Cristalino" : (settings.voicePitch ?? 1.15) < 1.1 ? "Cálido" : "Sereno")}
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.3"
              step="0.05"
              value={settings.voicePitch ?? 1.15}
              onChange={(e) => handleSlider("voicePitch", parseFloat(e.target.value))}
              className="w-full accent-pink-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-neutral-300 mb-1.5 font-medium">
              <span>Cadencia / Pacing</span>
              <span className="text-amber-400 font-mono">
                {((settings.voiceSpeed ?? 0.85) < 0.85 ? "Meditativo" : (settings.voiceSpeed ?? 0.85) > 0.9 ? "Fluido" : "Pausado")}
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.05"
              step="0.05"
              value={settings.voiceSpeed ?? 0.85}
              onChange={(e) => handleSlider("voiceSpeed", parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Controladores de Volúmenes Mezclados */}
      <div className="space-y-5 mb-6">
        <div className="bg-neutral-900/80 p-4 rounded-2xl border border-neutral-800">
          <div className="flex justify-between text-xs sm:text-sm mb-2 text-neutral-300 font-medium">
            <span className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-amber-400" />
              <span>Canal 1 • Volumen de Narración (Voz Femenina)</span>
            </span>
            <span className="text-amber-400 font-mono font-bold">
              {Math.round(settings.voiceVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.voiceVolume}
            onChange={(e) => handleSlider("voiceVolume", parseFloat(e.target.value))}
            className="w-full accent-amber-500 bg-neutral-800 h-2 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="bg-neutral-900/80 p-4 rounded-2xl border border-neutral-800">
          <div className="flex justify-between text-xs sm:text-sm mb-2 text-neutral-300 font-medium">
            <span className="flex items-center space-x-2">
              <Waves className="w-4 h-4 text-sky-400" />
              <span>Canal 2 • Frecuencias Sagradas (Hz)</span>
            </span>
            <span className="text-sky-400 font-mono font-bold">
              {Math.round(settings.ambientVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.ambientVolume}
            onChange={(e) => handleSlider("ambientVolume", parseFloat(e.target.value))}
            className="w-full accent-sky-500 bg-neutral-800 h-2 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Toggles Técnicos de Audio */}
      <div className="space-y-4 border-t border-neutral-800/80 pt-5 mb-6">
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/50">
          <div>
            <p className="text-sm font-semibold text-neutral-200">
              Atenuación Automática (Audio Ducking)
            </p>
            <p className="text-xs text-neutral-400">
              Atenúa el fondo sonoro automáticamente cuando la voz está hablando
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("audioDucking")}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              settings.audioDucking ? "bg-amber-500" : "bg-neutral-800"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.audioDucking ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/50">
          <div>
            <p className="text-sm font-semibold text-neutral-200">
              Mantener Frecuencia en Bucle Infinito
            </p>
            <p className="text-xs text-neutral-400">
              Los Hz continúan sonando suavemente al terminar la oración para meditación
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("infiniteLoopAmbient")}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              settings.infiniteLoopAmbient ? "bg-amber-500" : "bg-neutral-800"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.infiniteLoopAmbient ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Control Motor de Rayos y Modo Lámpara */}
      <div className="border-t border-neutral-800/80 pt-5 space-y-4">
        <div>
          <div className="flex items-center space-x-2 text-sm font-semibold text-neutral-200 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Intensidad Visual del Rayo Cósmico</span>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 text-xs text-center font-medium">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                type="button"
                key={level}
                onClick={() => handleIntensity(level)}
                className={`py-2 rounded-xl capitalize transition-all font-semibold ${
                  settings.visualIntensity === level
                    ? "bg-amber-500 text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {level === "low" ? "Baja" : level === "medium" ? "Media" : "Alta"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/50">
          <div>
            <p className="text-sm font-semibold text-neutral-200 flex items-center space-x-2">
              <Moon className="w-4 h-4 text-purple-400" />
              <span>Modo Lámpara Ambiental</span>
            </p>
            <p className="text-xs text-neutral-400">
              Atenúa los paneles secundarios para iluminar el espacio con el rayo sagrado
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("fullscreenMode")}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              settings.fullscreenMode ? "bg-amber-500" : "bg-neutral-800"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.fullscreenMode ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
