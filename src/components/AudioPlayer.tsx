import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Music,
  Bell,
  Sparkles,
  Sliders,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { ambientSound, MEDITATION_PRESETS } from "../utils/ambientAudio";
import { downloadWavBlob } from "../utils/wavUtils";
import { MeditationTrackId } from "../types";

interface AudioPlayerProps {
  audioUrl: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onRestart: () => void;
  voiceName?: string;
  isGenerating?: boolean;
  musicPlaying: boolean;
  onToggleMusic: () => void;
  musicVolume: number;
  onChangeMusicVolume: (vol: number) => void;
  currentTrackId: MeditationTrackId;
  onSelectTrack: (trackId: MeditationTrackId) => void;
  onOpenMusicTab?: () => void;
  onDownload?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  duration,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  onRestart,
  voiceName = "Aoede",
  isGenerating = false,
  musicPlaying,
  onToggleMusic,
  musicVolume,
  onChangeMusicVolume,
  currentTrackId,
  onSelectTrack,
  onOpenMusicTab,
  onDownload,
}) => {
  const [voiceVolume, setVoiceVolume] = useState<number>(1);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [bellFeedback, setBellFeedback] = useState<boolean>(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);
  const [isMixingDownload, setIsMixingDownload] = useState<boolean>(false);

  const activePreset =
    MEDITATION_PRESETS.find((p) => p.id === currentTrackId) ||
    MEDITATION_PRESETS[0];

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleRingBell = () => {
    ambientSound.playSingingBowlChime(528, 0.22);
    setBellFeedback(true);
    setTimeout(() => setBellFeedback(false), 1800);
  };

  // Download raw voice WAV
  const handleDownloadVoiceOnly = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `oracion-arcangel-jofiel-voz-${voiceName.toLowerCase()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowDownloadMenu(false);
  };

  // Render & download master WAV with background meditation music mixed!
  const handleDownloadWithMusic = async () => {
    if (!audioUrl) return;
    setIsMixingDownload(true);
    setShowDownloadMenu(false);

    try {
      const mixedBlob = await ambientSound.renderMixedWav(
        audioUrl,
        currentTrackId,
        voiceVolume,
        musicVolume
      );
      const filename = `oracion-arcangel-jofiel-con-musica-meditacion-${currentTrackId}.wav`;
      downloadWavBlob(mixedBlob, filename);
    } catch (err) {
      console.error("Error al mezclar audio con música:", err);
      // Fallback to voice only
      handleDownloadVoiceOnly();
    } finally {
      setIsMixingDownload(false);
    }
  };

  return (
    <div
      id="audio-player-wrapper"
      className="bg-gradient-to-b from-stone-900 via-stone-950 to-amber-950 text-stone-100 rounded-3xl p-6 md:p-8 shadow-2xl border border-amber-500/30 relative overflow-hidden"
    >
      {/* Golden divine background illumination glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col space-y-6">
        {/* Header & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-sacred font-semibold tracking-wider text-amber-200">
                Oración del Arcángel Jofiel en Audio
              </h2>
              <p className="text-xs text-stone-400 flex flex-wrap items-center gap-2">
                <span className="text-amber-300 font-medium">Voz Latina: {voiceName}</span>
                <span>•</span>
                <span className="text-amber-300/90 flex items-center gap-1">
                  <Music className="w-3 h-3 text-amber-400" />
                  <span>Música: {activePreset.name}</span>
                </span>
                <span>•</span>
                <span>Master WAV 24kHz / 44.1kHz</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ambient Meditation Music Quick Toggle */}
            <button
              type="button"
              id="btn-toggle-ambient-pad"
              onClick={onToggleMusic}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                musicPlaying
                  ? "bg-amber-500/30 border-amber-400 text-amber-200 shadow-sm shadow-amber-500/20"
                  : "bg-white/5 border-white/10 text-stone-400 hover:text-stone-200 hover:bg-white/10"
              }`}
              title="Activar o pausar música de fondo de meditación"
            >
              <Music className={`w-3.5 h-3.5 ${musicPlaying ? "text-amber-300 animate-pulse" : ""}`} />
              <span>{musicPlaying ? "Música Activa" : "Activar Música"}</span>
            </button>

            {/* Singing Bowl Bell Trigger */}
            <button
              type="button"
              id="btn-singing-bowl-bell"
              onClick={handleRingBell}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 ${
                bellFeedback
                  ? "bg-amber-400 text-amber-950 border-amber-300 font-bold scale-105"
                  : "bg-white/5 border-white/10 text-stone-400 hover:text-amber-200 hover:border-amber-400/50 hover:bg-white/10"
              }`}
              title="Tocar campana tibetana sagrada de 528 Hz"
            >
              <Bell className={`w-3.5 h-3.5 ${bellFeedback ? "animate-bounce text-amber-950" : ""}`} />
              <span>{bellFeedback ? "Campana 528Hz ♪" : "Campana 528Hz"}</span>
            </button>

            {/* Download Menu Button */}
            {audioUrl && (
              <div className="relative">
                <button
                  type="button"
                  id="btn-download-wav-menu"
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={isMixingDownload}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 shadow-md shadow-amber-500/20 transition-all hover:scale-102 active:scale-95 disabled:opacity-50"
                  title="Descargar audio en archivo .WAV"
                >
                  {isMixingDownload ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mezclando…</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Audio</span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
                    </>
                  )}
                </button>

                {showDownloadMenu && (
                  <div
                    id="dropdown-download-options"
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-stone-900/95 backdrop-blur-md border border-amber-500/30 p-2 shadow-2xl z-40 text-xs space-y-1"
                  >
                    <button
                      type="button"
                      id="btn-download-with-music"
                      onClick={handleDownloadWithMusic}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-amber-500/20 hover:text-amber-200 flex items-start space-x-2.5 transition-colors"
                    >
                      <Music className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-stone-100">
                          Con Música de Meditación
                        </p>
                        <p className="text-[10px] text-stone-400">
                          Voz + fondo {activePreset.name} en estéreo
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      id="btn-download-voice-only"
                      onClick={handleDownloadVoiceOnly}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 text-stone-300 hover:text-white flex items-start space-x-2.5 transition-colors"
                    >
                      <Volume2 className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Solo Voz (Original)</p>
                        <p className="text-[10px] text-stone-400">
                          Locución pura sin fondo musical
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Waveform Visualizer simulation */}
        <div className="h-12 flex items-center justify-center space-x-1 px-4 py-2 bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative">
          {musicPlaying && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-yellow-400/10 to-amber-500/5 pointer-events-none animate-pulse" />
          )}

          {Array.from({ length: 48 }).map((_, i) => {
            const voicePulse = isPlaying
              ? Math.sin(i * 0.4 + currentTime * 3) * 65 + 30
              : 0;
            const musicPulse = musicPlaying
              ? Math.sin(i * 0.2 + Date.now() * 0.003) * 20 + 15
              : 0;
            const combined = Math.min(95, Math.max(8, voicePulse + musicPulse));

            return (
              <div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-amber-600 via-yellow-400 to-amber-200 transition-all duration-150"
                style={{
                  height: `${combined}%`,
                  opacity: isPlaying ? 0.95 : musicPlaying ? 0.6 : 0.2,
                }}
              />
            );
          })}
        </div>

        {/* Scrubber and Times */}
        <div className="space-y-2">
          <input
            type="range"
            id="audio-scrubber-slider"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            disabled={!audioUrl || isGenerating}
            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none disabled:opacity-40"
          />
          <div className="flex justify-between text-xs font-mono text-stone-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Primary Controls Row: Speed, Play/Pause, Volume Mixer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Playback speed selector */}
          <div className="flex items-center space-x-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <span className="text-[11px] text-stone-400 px-2 font-medium">
              Velocidad:
            </span>
            {[0.8, 0.9, 1.0].map((rate) => (
              <button
                key={rate}
                type="button"
                id={`btn-speed-${rate}`}
                onClick={() => setPlaybackRate(rate)}
                className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                  playbackRate === rate
                    ? "bg-amber-500 text-amber-950 font-semibold"
                    : "text-stone-300 hover:bg-white/10"
                }`}
              >
                {rate === 0.9 ? "0.9x Sereno" : `${rate}x`}
              </button>
            ))}
          </div>

          {/* Center: Replay, Play/Pause & Direct Download Button */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              id="btn-restart-audio"
              onClick={onRestart}
              disabled={!audioUrl || isGenerating}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition-colors disabled:opacity-40"
              title="Reiniciar oración desde el principio"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              id="btn-main-play-pause"
              onClick={onPlayPause}
              disabled={isGenerating}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-amber-950 shadow-xl transition-all ${
                isPlaying
                  ? "bg-amber-400 hover:bg-amber-300 scale-105 shadow-amber-400/40"
                  : "bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 hover:scale-110 shadow-amber-500/50"
              }`}
              title={isPlaying ? "Pausar oración" : "Reproducir oración"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Direct Download Button placed right next to Play/Pause when audio is available */}
            {audioUrl && (
              <button
                type="button"
                id="btn-download-audio-direct"
                onClick={onDownload || handleDownloadVoiceOnly}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-3.5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-400/50 hover:border-amber-400 transition-all hover:scale-105 active:scale-95 shadow-md shadow-amber-500/10 font-semibold text-xs sm:text-sm"
                title="Descargar archivo de audio WAV en tu dispositivo"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <span className="font-bold">Descargar</span>
              </button>
            )}
          </div>

          {/* Dual Volume Mixer: Voice & Meditation Music */}
          <div className="flex items-center space-x-3 bg-white/5 px-3 py-2 rounded-2xl border border-white/10 text-xs">
            {/* Voice Volume */}
            <div className="flex items-center space-x-1.5" title="Volumen de la voz">
              <span className="text-[10px] uppercase font-bold text-amber-400/80">Voz</span>
              <input
                type="range"
                id="input-voice-volume"
                min={0}
                max={1}
                step={0.05}
                value={isVoiceMuted ? 0 : voiceVolume}
                onChange={(e) => {
                  setVoiceVolume(parseFloat(e.target.value));
                  if (isVoiceMuted) setIsVoiceMuted(false);
                }}
                className="w-16 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div className="h-4 w-px bg-white/15" />

            {/* Music Volume */}
            <div className="flex items-center space-x-1.5" title="Volumen de la música de meditación">
              <Music className="w-3 h-3 text-amber-400" />
              <input
                type="range"
                id="input-player-music-volume"
                min={0}
                max={1}
                step={0.05}
                value={musicVolume}
                onChange={(e) => onChangeMusicVolume(parseFloat(e.target.value))}
                className="w-16 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[10px] font-mono text-stone-400 w-6 text-right">
                {Math.round(musicVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
