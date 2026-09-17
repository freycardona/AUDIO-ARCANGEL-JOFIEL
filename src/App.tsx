import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  FileText,
  Volume2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Share2,
  Sun,
  ShieldCheck,
  Feather,
  Music,
  Bell,
  Download,
} from "lucide-react";
import {
  DEFAULT_RAW_PRAYER,
  DEFAULT_TONE,
  INITIAL_SEGMENTS,
  AVAILABLE_VOICES,
} from "./data/defaultPrayer";
import { ScriptSegment, GeneratedAudioData, VoiceOption, MeditationTrackId } from "./types";
import { PrayerTeleprompter } from "./components/PrayerTeleprompter";
import { AudioPlayer } from "./components/AudioPlayer";
import { VoiceSettings } from "./components/VoiceSettings";
import { BreathingGuide } from "./components/BreathingGuide";
import { MeditationMusicSuite } from "./components/MeditationMusicSuite";
import { browserTts, getBestLatinVoice } from "./utils/browserTts";
import { ambientSound, MEDITATION_PRESETS } from "./utils/ambientAudio";

export default function App() {
  const [rawText, setRawText] = useState<string>(DEFAULT_RAW_PRAYER);
  const [toneDirective, setToneDirective] = useState<string>(DEFAULT_TONE);
  const [segments, setSegments] = useState<ScriptSegment[]>(INITIAL_SEGMENTS);
  const [selectedVoice, setSelectedVoice] = useState<string>("Aoede");
  const [pauseMultiplier, setPauseMultiplier] = useState<number>(1);

  // Active view tab: "prayer" | "music" | "settings" | "editor"
  const [activeTab, setActiveTab] = useState<"prayer" | "music" | "settings" | "editor">("prayer");

  // Playback & Audio State
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudioData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [activePauseRemaining, setActivePauseRemaining] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBrowserPlaying, setIsBrowserPlaying] = useState<boolean>(false);

  // Meditation Music State
  const [currentTrackId, setCurrentTrackId] = useState<MeditationTrackId>("luz-dorada-432");
  const [musicVolume, setMusicVolume] = useState<number>(0.25);
  const [musicPlaying, setMusicPlaying] = useState<boolean>(false);
  const [autoAccompaniment, setAutoAccompaniment] = useState<boolean>(true);
  const [continueAfterPrayer, setContinueAfterPrayer] = useState<boolean>(false);

  // Hidden Audio Element Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check backend health and API key status on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (!data.hasApiKey) {
          console.warn("API key status: no GEMINI_API_KEY detected in env.");
        }
      })
      .catch((err) => console.error("Health check error:", err));
  }, []);

  // Sync with ambient sound engine state
  useEffect(() => {
    const unsub = ambientSound.subscribe((playing, track) => {
      setMusicPlaying(playing);
      setCurrentTrackId(track);
    });
    return unsub;
  }, []);

  // Update audio current time and synchronized teleprompter
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const cur = audio.currentTime;
      setCurrentTime(cur);

      if (generatedAudio?.timeline) {
        // Find matching segment in timeline
        const mark = generatedAudio.timeline.find(
          (t) => cur >= t.startTime && cur < t.startTime + t.duration
        );

        if (mark) {
          setActiveSegmentId(mark.id);
          if (mark.type === "pause") {
            const remaining = Math.max(1, Math.ceil(mark.startTime + mark.duration - cur));
            setActivePauseRemaining(remaining);
          } else {
            setActivePauseRemaining(undefined);
          }
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setActiveSegmentId(null);
      setActivePauseRemaining(undefined);

      // Stop music if not configured to continue lingering in meditation
      if (!continueAfterPrayer) {
        ambientSound.stop(2.5);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [generatedAudio, continueAfterPrayer]);

  // Adjust segment pauses when multiplier changes
  useEffect(() => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.type === "pause") {
          const original =
            INITIAL_SEGMENTS.find((s) => s.id === seg.id)?.pauseSeconds || 3;
          return {
            ...seg,
            pauseSeconds: Math.round(original * pauseMultiplier),
          };
        }
        return seg;
      })
    );
  }, [pauseMultiplier]);

  // Handle Generate Master Audio using Gemini TTS
  const handleGenerateAudio = async () => {
    setErrorMessage(null);
    setIsGenerating(true);
    setGenerationProgress("Iniciando conexión con Gemini TTS (Voz: " + selectedVoice + ")…");

    // Pause any ongoing playback
    if (audioRef.current) {
      audioRef.current.pause();
    }
    browserTts.stop();
    setIsPlaying(false);
    setIsBrowserPlaying(false);

    try {
      setGenerationProgress("Sintetizando versos y calculando pausas exactas de silencio…");

      const response = await fetch("/api/tts/generate-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          tone: toneDirective,
          voice: selectedVoice,
          customSegments: segments,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "No se pudo generar el audio. Revisa tu clave de API."
        );
      }

      const newAudioData: GeneratedAudioData = {
        audioUrl: data.audioUrl,
        duration: data.duration,
        sampleRate: data.sampleRate,
        timeline: data.timeline,
        voice: data.voice,
        totalSize: data.totalSize,
        generatedAt: new Date(),
      };

      setGeneratedAudio(newAudioData);

      // Load into audio element
      if (audioRef.current) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.load();
      }

      setGenerationProgress("¡Audio generado con éxito!");
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress("");
        // Auto-play generated audio
        handlePlayPause(newAudioData);
      }, 700);
    } catch (err: any) {
      console.error("Error generating audio:", err);
      setIsGenerating(false);
      setGenerationProgress("");
      setErrorMessage(
        err.message ||
          "Error al generar el audio con Gemini. Puedes utilizar también el modo de voz directa del navegador."
      );
    }
  };

  // Play / Pause handler
  const handlePlayPause = (audioOverride?: GeneratedAudioData) => {
    const targetAudio = audioOverride || generatedAudio;

    if (!targetAudio && !isBrowserPlaying) {
      // If audio has not been generated yet, start browser speech synthesis
      handlePlayBrowserSpeech();
      return;
    }

    if (isBrowserPlaying) {
      browserTts.stop();
      setIsBrowserPlaying(false);
      setIsPlaying(false);
      setActiveSegmentId(null);
      if (!continueAfterPrayer) {
        ambientSound.stop(1.5);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (!continueAfterPrayer) {
        ambientSound.stop(1.5);
      }
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          // Start meditation music accompaniment if enabled
          if (autoAccompaniment && !ambientSound.getIsPlaying()) {
            ambientSound.setVolume(musicVolume);
            ambientSound.play(currentTrackId, 2.5);
          }
        })
        .catch((e) => {
          console.warn("Audio play blocked:", e);
          setErrorMessage("Presiona de nuevo para reproducir.");
        });
    }
  };

  // Local download function utilizing generatedAudio.audioUrl to trigger download
  const handleDownloadGeneratedAudio = () => {
    if (!generatedAudio?.audioUrl) {
      setErrorMessage("Primero debes generar el audio para poder descargarlo.");
      return;
    }

    const downloadLink = document.createElement("a");
    downloadLink.href = generatedAudio.audioUrl;
    downloadLink.download = `oracion-arcangel-jofiel-${(selectedVoice || "latina").toLowerCase()}.wav`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Play via Browser Web Speech fallback
  const handlePlayBrowserSpeech = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(true);
    setIsBrowserPlaying(true);

    if (autoAccompaniment && !ambientSound.getIsPlaying()) {
      ambientSound.setVolume(musicVolume);
      ambientSound.play(currentTrackId, 2);
    }

    browserTts.playPrayer(segments, {
      onSegmentChange: (segId, isPause, remaining) => {
        setActiveSegmentId(segId);
        if (isPause) {
          setActivePauseRemaining(remaining);
        } else {
          setActivePauseRemaining(undefined);
        }
      },
      onEnded: () => {
        setIsPlaying(false);
        setIsBrowserPlaying(false);
        setActiveSegmentId(null);
        setActivePauseRemaining(undefined);
        if (!continueAfterPrayer) {
          ambientSound.stop(2.5);
        }
      },
      onError: (err) => {
        setErrorMessage(err);
        setIsPlaying(false);
        setIsBrowserPlaying(false);
      },
    });
  };

  // Seek handler
  const handleSeek = (time: number) => {
    if (audioRef.current && generatedAudio) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Restart handler
  const handleRestart = () => {
    if (isBrowserPlaying) {
      browserTts.stop();
      handlePlayBrowserSpeech();
      return;
    }

    if (audioRef.current && generatedAudio) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play();
      setIsPlaying(true);
      if (autoAccompaniment && !ambientSound.getIsPlaying()) {
        ambientSound.setVolume(musicVolume);
        ambientSound.play(currentTrackId, 2);
      }
    }
  };

  // Toggle meditation music directly
  const handleToggleMusic = () => {
    if (musicPlaying) {
      ambientSound.stop();
    } else {
      ambientSound.setVolume(musicVolume);
      ambientSound.play(currentTrackId);
    }
  };

  // Preview a single segment
  const handlePreviewSegment = async (seg: ScriptSegment) => {
    if (!seg.text) return;
    try {
      const response = await fetch("/api/tts/generate-segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: seg.text,
          tone: seg.toneInstruction || toneDirective,
          voice: selectedVoice,
          isWhisper: seg.isWhisper,
        }),
      });

      const data = await response.json();
      if (data.audioUrl) {
        const tempAudio = new Audio(data.audioUrl);
        tempAudio.play();
      }
    } catch (e) {
      // Fallback to browser speech with Latin American voice
      const u = new SpeechSynthesisUtterance(seg.text);
      const latinVoice = getBestLatinVoice();
      if (latinVoice) {
        u.voice = latinVoice;
        u.lang = latinVoice.lang || "es-419";
      } else {
        u.lang = "es-419";
      }
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  // Active pause segment details if any
  const currentPauseSegment =
    activeSegmentId && activePauseRemaining !== undefined
      ? segments.find((s) => s.id === activeSegmentId && s.type === "pause")
      : null;

  const currentPreset =
    MEDITATION_PRESETS.find((p) => p.id === currentTrackId) ||
    MEDITATION_PRESETS[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-stone-50 to-amber-100/40 text-stone-900 pb-20 selection:bg-amber-200">
      {/* Hidden audio element for generated WAV */}
      <audio ref={audioRef} preload="auto" />

      {/* Top Divine Illumination Header */}
      <header className="border-b border-amber-200/70 bg-white/70 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-amber-950 shadow-md shadow-amber-500/20">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-sacred font-bold text-amber-950 tracking-wide">
                  Arcángel Jofiel • Conversor de Texto a Audio
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Voz Latina • Luz y Sabiduría
                </span>
              </div>
              <p className="text-xs text-stone-600 font-normal">
                Audio con voz latina serena en español neutro, música armónica y pausas sagradas
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden md:flex items-center space-x-1.5 text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Gemini 3.1 TTS</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Error message banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-start justify-between text-rose-900 text-sm">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Aviso de audio</p>
                <p className="text-xs text-rose-800 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold px-2 py-1 rounded-lg bg-rose-200/60 hover:bg-rose-200 text-rose-900 ml-4"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Primary Audio Player & Generator Bar */}
        <section id="section-audio-player">
          <AudioPlayer
            audioUrl={generatedAudio?.audioUrl || null}
            duration={generatedAudio?.duration || 0}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onPlayPause={() => handlePlayPause()}
            onSeek={handleSeek}
            onRestart={handleRestart}
            voiceName={selectedVoice}
            isGenerating={isGenerating}
            musicPlaying={musicPlaying}
            onToggleMusic={handleToggleMusic}
            musicVolume={musicVolume}
            onChangeMusicVolume={setMusicVolume}
            currentTrackId={currentTrackId}
            onSelectTrack={setCurrentTrackId}
            onOpenMusicTab={() => setActiveTab("music")}
            onDownload={handleDownloadGeneratedAudio}
          />
        </section>

        {/* Meditation Music Quick Banner Strip */}
        <div
          id="meditation-quick-strip"
          className="bg-white/80 backdrop-blur-md rounded-2xl p-3 sm:px-5 border border-amber-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                musicPlaying
                  ? "bg-amber-500 text-amber-950 animate-pulse"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <Music className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>Música de Fondo: {currentPreset.name}</span>
                {musicPlaying && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                    Sonando Ahora
                  </span>
                )}
              </p>
              <p className="text-[11px] text-stone-500">
                {currentPreset.frequency} • Acompañamiento armónico suave
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="btn-quick-toggle-music"
              onClick={handleToggleMusic}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                musicPlaying
                  ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                  : "bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-xs"
              }`}
            >
              {musicPlaying ? "Pausar Música" : "Iniciar Música"}
            </button>

            <button
              type="button"
              id="btn-open-music-tab-pill"
              onClick={() => setActiveTab("music")}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 font-semibold"
            >
              Cambiar Pistas / Ajustar
            </button>
          </div>
        </div>

        {/* Big Action Conversion Hub */}
        <section
          id="section-generator-hub"
          className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1.5 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center space-x-1.5 text-xs font-semibold tracking-wider text-amber-800 uppercase bg-amber-100/70 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Conversión Sagrada a Audio</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-sacred font-bold text-amber-950">
              Generar Oración en Audio Completo
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Convierte el texto íntegro con la entonación serena solicitada,
              respetando fielmente cada intervalo de silencio (3s, 5s, 7s, 10s),
              el susurro final de "Amén", y la música de meditación seleccionada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Quick Instant Browser Speech preview button */}
            <button
              type="button"
              id="btn-play-browser-speech"
              onClick={handlePlayBrowserSpeech}
              disabled={isGenerating}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-stone-300 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 text-stone-700 text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 transition-all"
              title="Escuchar al instante con la voz del sistema y música de meditación sin esperar generación"
            >
              <Volume2 className="w-4 h-4 text-amber-700" />
              <span>Voz Directa Inmediata</span>
            </button>

            {/* Primary Gemini TTS Generation Button */}
            <button
              type="button"
              id="btn-generate-master-audio"
              onClick={handleGenerateAudio}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-stone-950" />
                  <span>Procesando Audio…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-stone-950" />
                  <span>{generatedAudio ? "Regenerar Audio" : "Convertir a Audio (Gemini TTS)"}</span>
                </>
              )}
            </button>

            {/* Quick download button in hub when audio was successfully generated */}
            {generatedAudio?.audioUrl && (
              <button
                type="button"
                id="btn-download-from-hub"
                onClick={handleDownloadGeneratedAudio}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-98"
                title="Descargar archivo WAV generado"
              >
                <Download className="w-4 h-4" />
                <span>Descargar WAV</span>
              </button>
            )}
          </div>
        </section>

        {/* Generating Progress indicator */}
        {isGenerating && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center space-x-3 text-amber-950 text-sm animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{generationProgress}</p>
              <p className="text-xs text-stone-600 mt-0.5">
                Generando ondas PCM a 24000 Hz con modulación suave en español latinoamericano.
              </p>
            </div>
          </div>
        )}

        {/* Active Breathing Guide if playing and in pause segment */}
        {currentPauseSegment && activePauseRemaining !== undefined && (
          <BreathingGuide
            remainingSeconds={activePauseRemaining}
            totalSeconds={currentPauseSegment.pauseSeconds || 5}
          />
        )}

        {/* View Tabs Selector */}
        <div className="flex items-center space-x-2 border-b border-stone-200/80 pb-2 overflow-x-auto">
          <button
            type="button"
            id="tab-prayer-view"
            onClick={() => setActiveTab("prayer")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "prayer"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Feather className="w-4 h-4" />
            <span>Oración y Teleprómpter</span>
          </button>

          <button
            type="button"
            id="tab-music-view"
            onClick={() => setActiveTab("music")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "music"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Música de Meditación</span>
            {musicPlaying && (
              <span className="w-2 h-2 rounded-full bg-yellow-300 animate-ping ml-1" />
            )}
          </button>

          <button
            type="button"
            id="tab-settings-view"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "settings"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Voz y Ajustes</span>
          </button>

          <button
            type="button"
            id="tab-editor-view"
            onClick={() => setActiveTab("editor")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === "editor"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Texto Original</span>
          </button>
        </div>

        {/* Tab 1: Prayer & Teleprompter */}
        {activeTab === "prayer" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 px-1">
              <span>
                Mostrando {segments.filter((s) => s.type === "speech").length} versos
                sagrados y {segments.filter((s) => s.type === "pause").length} pausas
                meditativas
              </span>
              <span>Haz clic en el icono de bocina de cualquier verso para escucharlo</span>
            </div>

            <PrayerTeleprompter
              segments={segments}
              currentActiveId={activeSegmentId}
              currentPauseRemaining={activePauseRemaining}
              isPlaying={isPlaying}
              onPreviewSegment={handlePreviewSegment}
            />
          </div>
        )}

        {/* Tab 2: Meditation Music Suite */}
        {activeTab === "music" && (
          <MeditationMusicSuite
            autoAccompaniment={autoAccompaniment}
            onToggleAutoAccompaniment={setAutoAccompaniment}
            continueAfterPrayer={continueAfterPrayer}
            onToggleContinueAfterPrayer={setContinueAfterPrayer}
            musicVolume={musicVolume}
            onChangeMusicVolume={setMusicVolume}
            currentTrackId={currentTrackId}
            onSelectTrack={setCurrentTrackId}
          />
        )}

        {/* Tab 3: Voice & Tone Settings */}
        {activeTab === "settings" && (
          <VoiceSettings
            voices={AVAILABLE_VOICES}
            selectedVoice={selectedVoice}
            onSelectVoice={(vId) => setSelectedVoice(vId)}
            toneText={toneDirective}
            onChangeTone={(t) => setToneDirective(t)}
            pauseMultiplier={pauseMultiplier}
            onChangePauseMultiplier={(m) => setPauseMultiplier(m)}
          />
        )}

        {/* Tab 4: Text & Script Editor */}
        {activeTab === "editor" && (
          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-amber-950 font-sacred">
                  Texto de la Oración con Directivas
                </h3>
                <p className="text-xs text-stone-500">
                  Puedes ajustar el texto, las pausas entre paréntesis o agregar tus
                  propias intenciones
                </p>
              </div>
              <button
                type="button"
                id="btn-restore-default-prayer"
                onClick={() => {
                  setRawText(DEFAULT_RAW_PRAYER);
                  setSegments(INITIAL_SEGMENTS);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600"
              >
                Restablecer Original
              </button>
            </div>

            <textarea
              id="textarea-prayer-raw"
              rows={18}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full font-mono text-sm leading-relaxed p-4 rounded-2xl border border-stone-300 bg-stone-50/50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        )}

        {/* Footer Notes & Arcángel Jofiel Reflection */}
        <footer className="pt-6 border-t border-stone-200/70 text-center space-y-2">
          <p className="text-xs text-stone-500 max-w-2xl mx-auto leading-relaxed">
            «Amado Arcángel Jofiel, portador del rayo dorado de la iluminación divina,
            guía mis pensamientos hacia la verdad, la serenidad y la belleza eterna.»
          </p>
          <p className="text-[11px] text-stone-400">
            Formato: Audio WAV 24,000 Hz Mono / 44,100 Hz Estéreo con Música • Pausas sagradas y frecuencias 432 Hz y 528 Hz
          </p>
        </footer>
      </main>
    </div>
  );
}
