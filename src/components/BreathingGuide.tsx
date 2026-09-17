import React from "react";
import { Sparkles, Sun } from "lucide-react";

interface BreathingGuideProps {
  remainingSeconds: number;
  totalSeconds: number;
}

export const BreathingGuide: React.FC<BreathingGuideProps> = ({
  remainingSeconds,
  totalSeconds,
}) => {
  // Cycle breathing prompt based on time
  const phase =
    remainingSeconds > totalSeconds * 0.6
      ? "Inhala paz y luz dorada…"
      : remainingSeconds > totalSeconds * 0.3
      ? "Integra la sabiduría en tu mente…"
      : "Exhala toda duda y confusión…";

  return (
    <div
      id="breathing-guide-display"
      className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-100/40 to-yellow-500/10 border border-amber-300/80 flex flex-col items-center justify-center text-center relative overflow-hidden my-4"
    >
      {/* Sacred animated breathing rings */}
      <div className="relative w-32 h-32 flex items-center justify-center my-3">
        <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping opacity-75" />
        <div className="absolute inset-2 rounded-full bg-amber-300/30 animate-pulse" />
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex flex-col items-center justify-center shadow-lg shadow-amber-400/30 text-amber-950 font-bold">
          <Sun className="w-6 h-6 text-amber-950/80 animate-spin-slow" />
          <span className="text-sm font-mono mt-0.5">{remainingSeconds}s</span>
        </div>
      </div>

      <div className="space-y-1 z-10">
        <div className="flex items-center justify-center space-x-1 text-amber-900 font-sacred text-base font-semibold">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Pausa Sagrada de Silencio</span>
          <Sparkles className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-sm text-amber-950 font-medium tracking-wide transition-all">
          {phase}
        </p>
        <p className="text-xs text-stone-500">
          Duración del silencio: {totalSeconds} segundos
        </p>
      </div>
    </div>
  );
};
