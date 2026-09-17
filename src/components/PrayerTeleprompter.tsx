import React, { useEffect, useRef } from "react";
import { ScriptSegment, TimelineMark } from "../types";
import { Sparkles, Clock, Volume2, Heart } from "lucide-react";

interface PrayerTeleprompterProps {
  segments: ScriptSegment[];
  currentActiveId: string | null;
  currentPauseRemaining?: number;
  isPlaying: boolean;
  onPreviewSegment?: (segment: ScriptSegment) => void;
  timeline?: TimelineMark[];
}

export const PrayerTeleprompter: React.FC<PrayerTeleprompterProps> = ({
  segments,
  currentActiveId,
  currentPauseRemaining,
  isPlaying,
  onPreviewSegment,
}) => {
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to active segment smoothly
  useEffect(() => {
    if (currentActiveId && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentActiveId]);

  return (
    <div
      id="teleprompter-container"
      className="relative flex flex-col space-y-4 max-h-[560px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-200"
    >
      {segments.map((seg, idx) => {
        const isActive = currentActiveId === seg.id;

        if (seg.type === "pause") {
          const pauseSec = seg.pauseSeconds || 3;
          const displaySec =
            isActive && currentPauseRemaining !== undefined
              ? currentPauseRemaining
              : pauseSec;

          return (
            <div
              key={seg.id}
              ref={isActive ? activeItemRef : null}
              id={`segment-pause-${seg.id}`}
              className={`transition-all duration-500 rounded-xl px-4 py-3 flex items-center justify-between border ${
                isActive
                  ? "bg-amber-100/60 border-amber-400/80 shadow-md shadow-amber-200/40 ring-2 ring-amber-300/60 scale-[1.01]"
                  : "bg-stone-50/60 border-stone-200/70 text-stone-500 hover:bg-stone-100/50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                    isActive
                      ? "bg-amber-500 text-white animate-pulse"
                      : "bg-stone-200/80 text-stone-600"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isActive ? "text-amber-950 font-semibold" : "text-stone-600"
                    }`}
                  >
                    {pauseSec >= 8
                      ? "Silencio prolongado de meditación e integración"
                      : `Pausa sagrada de introspección`}
                  </p>
                  <p className="text-xs text-stone-500">
                    {isActive
                      ? "Inhala profunda paz… exhala suavemente"
                      : `Duración calculada: ${pauseSec} segundos`}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {isActive && (
                  <div className="flex items-center space-x-1 mr-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-xs font-semibold text-amber-900">
                      Respirando…
                    </span>
                  </div>
                )}
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium tracking-wide ${
                    isActive
                      ? "bg-amber-500 text-white shadow-sm"
                      : "bg-stone-200/70 text-stone-700"
                  }`}
                >
                  {isActive ? `${displaySec}s restantes` : `${pauseSec} seg`}
                </span>
              </div>
            </div>
          );
        }

        // Speech verse
        return (
          <div
            key={seg.id}
            ref={isActive ? activeItemRef : null}
            id={`segment-speech-${seg.id}`}
            className={`group relative transition-all duration-300 rounded-2xl p-5 border text-left ${
              isActive
                ? "bg-gradient-to-r from-amber-50 via-amber-100/40 to-yellow-50 border-amber-400 shadow-lg shadow-amber-300/20 ring-2 ring-amber-300/70"
                : "bg-white/80 border-stone-200/80 hover:border-amber-300/70 hover:bg-amber-50/20"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-medium tracking-wider text-amber-800/80 uppercase">
                    Verso {Math.floor(idx / 2) + 1}
                  </span>
                  {seg.isWhisper && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-rose-100/80 text-rose-800 px-2 py-0.5 rounded-full font-medium">
                      <Heart className="w-3 h-3" />
                      Susurro devocional suave
                    </span>
                  )}
                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                      <Sparkles className="w-3 h-3 text-amber-700" />
                      Voz Activa
                    </span>
                  )}
                </div>

                <p
                  className={`text-lg md:text-xl leading-relaxed tracking-wide transition-colors ${
                    isActive
                      ? "text-amber-950 font-medium drop-shadow-sm font-sacred"
                      : "text-stone-800"
                  }`}
                >
                  {seg.text}
                </p>

                {seg.toneInstruction && (
                  <p className="mt-2 text-xs text-stone-500 italic flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                    {seg.toneInstruction}
                  </p>
                )}
              </div>

              {onPreviewSegment && !isPlaying && (
                <button
                  type="button"
                  id={`btn-preview-verse-${seg.id}`}
                  onClick={() => onPreviewSegment(seg)}
                  title="Escuchar este verso individualmente"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 border border-stone-200 hover:border-amber-300"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
