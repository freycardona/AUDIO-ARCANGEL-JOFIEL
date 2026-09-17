import React from "react";
import { VoiceOption } from "../types";
import { Mic, Sliders, CheckCircle2, Info } from "lucide-react";

interface VoiceSettingsProps {
  voices: VoiceOption[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  toneText: string;
  onChangeTone: (newTone: string) => void;
  pauseMultiplier: number;
  onChangePauseMultiplier: (val: number) => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  toneText,
  onChangeTone,
  pauseMultiplier,
  onChangePauseMultiplier,
}) => {
  return (
    <div
      id="voice-settings-panel"
      className="bg-white/85 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-amber-200/80 shadow-lg space-y-6 text-stone-800"
    >
      <div className="flex items-center space-x-3 border-b border-stone-200 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-amber-950 font-sacred">
            Configuración de Voz y Tono
          </h3>
          <p className="text-xs text-stone-500">
            Parámetros de locución, acento latinoamericano y pausas de silencio
          </p>
        </div>
      </div>

      {/* Voice Selection Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
            Voces en Español Latinoamericano
          </label>
          <span className="inline-flex items-center text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
            Acento Latino Neutro • Seseo Natural
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {voices.map((v) => {
            const isSelected = selectedVoice === v.id;
            return (
              <button
                key={v.id}
                type="button"
                id={`btn-select-voice-${v.id}`}
                onClick={() => onSelectVoice(v.id)}
                className={`text-left p-3.5 rounded-2xl border transition-all relative ${
                  isSelected
                    ? "bg-amber-50/90 border-amber-500 shadow-sm ring-2 ring-amber-300/60"
                    : "bg-stone-50/60 border-stone-200 hover:border-amber-300 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-stone-900">
                        {v.name}
                      </span>
                      {v.recommended && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white">
                          RECOMENDADA
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Género: {v.gender}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {v.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone Description Directive */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="textarea-tone-prompt"
            className="block text-xs font-semibold uppercase tracking-wider text-stone-600"
          >
            Directiva de Tono Emocional y Cadencia
          </label>
          <span className="text-[11px] text-amber-800 font-medium">
            Español Latinoamericano
          </span>
        </div>
        <textarea
          id="textarea-tone-prompt"
          rows={3}
          value={toneText}
          onChange={(e) => onChangeTone(e.target.value)}
          className="w-full text-sm rounded-xl border border-stone-300 p-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50/50"
          placeholder="Ej: Cálido, suave, profundamente sereno y pausado..."
        />
        <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          Esta indicación guía la modulación vocal de Gemini TTS para transmitir
          la dulzura e iluminación del Arcángel Jofiel.
        </p>
      </div>

      {/* Pause Multiplier */}
      <div className="space-y-2 pt-2 border-t border-stone-200">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-700" />
            Ajuste de Pausas de Silencio
          </label>
          <span className="text-xs font-mono font-semibold text-amber-900">
            {pauseMultiplier === 1
              ? "Exactas del texto (1.0x)"
              : `${pauseMultiplier}x de duración`}
          </span>
        </div>
        <input
          type="range"
          id="input-pause-multiplier"
          min={0.5}
          max={1.5}
          step={0.1}
          value={pauseMultiplier}
          onChange={(e) => onChangePauseMultiplier(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[11px] text-stone-500">
          <span>Más cortas (0.5x)</span>
          <span className="font-semibold text-stone-700">Original (1.0x)</span>
          <span>Más prolongadas (1.5x)</span>
        </div>
      </div>
    </div>
  );
};
