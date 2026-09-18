import React from "react";
import { Music, Play, Square, Volume2 } from "lucide-react";
import { MeditationTrackId } from "../types";
import { ambientSound, MEDITATION_PRESETS } from "../utils/ambientAudio";

interface Props {
  autoAccompaniment: boolean;
  onToggleAutoAccompaniment: (value: boolean) => void;
  continueAfterPrayer: boolean;
  onToggleContinueAfterPrayer: (value: boolean) => void;
  musicVolume: number;
  onChangeMusicVolume: (value: number) => void;
  currentTrackId: MeditationTrackId;
  onSelectTrack: (id: MeditationTrackId) => void;
}

export function MeditationMusicSuite({
  autoAccompaniment,
  onToggleAutoAccompaniment,
  continueAfterPrayer,
  onToggleContinueAfterPrayer,
  musicVolume,
  onChangeMusicVolume,
  currentTrackId,
  onSelectTrack,
}: Props) {
  const [playing, setPlaying] = React.useState(ambientSound.getIsPlaying());

  React.useEffect(() => ambientSound.subscribe((isPlaying) => setPlaying(isPlaying)), []);

  const preview = (id: MeditationTrackId) => {
    onSelectTrack(id);
    ambientSound.setVolume(musicVolume);
    if (ambientSound.getIsPlaying()) ambientSound.stop(0.15);
    window.setTimeout(() => ambientSound.play(id, 0.4), 180);
  };

  return (
    <section className="bg-white/80 border border-amber-200 rounded-3xl p-5 sm:p-7 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Music className="w-5 h-5 text-amber-800" />
        </div>
        <div>
          <h2 className="font-sacred font-bold text-amber-950">Música de meditación</h2>
          <p className="text-sm text-stone-600">Acompañamiento armónico generado en el navegador.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {MEDITATION_PRESETS.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => preview(track.id)}
            className={`text-left rounded-2xl border p-4 transition ${currentTrackId === track.id ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-amber-300"}`}
          >
            <div className="font-semibold text-stone-900">{track.name}</div>
            <div className="text-xs text-stone-500 mt-1">{track.frequency}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => playing ? ambientSound.stop(0.5) : ambientSound.play(currentTrackId, 0.5)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold"
        >
          {playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? "Detener" : "Escuchar"}
        </button>
        <Volume2 className="w-4 h-4 text-stone-500" />
        <input
          aria-label="Volumen de música"
          type="range"
          min="0"
          max="0.6"
          step="0.01"
          value={musicVolume}
          onChange={(e) => {
            const value = Number(e.target.value);
            onChangeMusicVolume(value);
            ambientSound.setVolume(value);
          }}
          className="flex-1"
        />
      </div>

      <div className="space-y-3 text-sm">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={autoAccompaniment} onChange={(e) => onToggleAutoAccompaniment(e.target.checked)} />
          Acompañar automáticamente la oración
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={continueAfterPrayer} onChange={(e) => onToggleContinueAfterPrayer(e.target.checked)} />
          Continuar la música al terminar la oración
        </label>
      </div>
    </section>
  );
}
