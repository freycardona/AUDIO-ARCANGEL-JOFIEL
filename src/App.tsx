import React, { useState } from "react";
import { archangelsData } from "./data/archangels";
import { AudioPlayer } from "./components/AudioPlayer";
import { VoiceSettings } from "./components/VoiceSettings";
import { PrayerTeleprompter } from "./components/PrayerTeleprompter";
import { Archangel, AdvancedAudioSettings } from "./types";
import { speakSampleFemaleVoice } from "./utils/browserTts";
import {
  Sparkles,
  BookOpen,
  Compass,
  Sliders,
  Sun,
  Shield,
  Heart,
  Feather,
  Flame,
  Radio,
  Eye,
  FileText,
  Volume2,
} from "lucide-react";

export const App: React.FC = () => {
  // 1. Arcángel seleccionado (inicia con San Miguel por defecto)
  const [selectedArcangel, setSelectedArcangel] = useState<Archangel>(archangelsData[0]);

  // 2. Pestaña de información activa
  const [activeTab, setActiveTab] = useState<"altar" | "conocimiento" | "correspondencias" | "ajustes">("altar");

  // 3. Vista de Altar: Oración Lectura vs Teleprómpter
  const [altarViewMode, setAltarViewMode] = useState<"oracion" | "teleprompter">("oracion");

  // 4. Configuraciones avanzadas de audio y visualización
  const [audioSettings, setAudioSettings] = useState<AdvancedAudioSettings>({
    voiceVolume: 1.0,
    ambientVolume: 0.7,
    audioDucking: true,
    infiniteLoopAmbient: false,
    visualIntensity: "medium",
    fullscreenMode: false,
    femaleVoiceType: "gemini_aoede",
    voicePitch: 1.15,
    voiceSpeed: 0.85,
  });

  const handleSettingsChange = (newSettings: AdvancedAudioSettings) => {
    setAudioSettings(newSettings);
  };

  // Helper para renderizar iconos temáticos según el Arcángel
  const getArchangelIcon = (id: string) => {
    switch (id) {
      case "miguel":
        return <Shield className="w-3.5 h-3.5" />;
      case "jofiel":
        return <Sun className="w-3.5 h-3.5" />;
      case "chamuel":
        return <Heart className="w-3.5 h-3.5" />;
      case "gabriel":
        return <Feather className="w-3.5 h-3.5" />;
      case "rafael":
        return <Sparkles className="w-3.5 h-3.5" />;
      case "uriel":
        return <Flame className="w-3.5 h-3.5" />;
      case "zadkiel":
        return <Radio className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className={`min-h-screen bg-black text-white font-sans antialiased pb-16 transition-colors duration-700 relative selection:bg-amber-500 selection:text-black`}
    >
      {/* Luz cósmica de fondo según el rayo del Arcángel activo */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-1000 z-0"
        style={{
          background: `radial-gradient(circle at 50% 15%, ${selectedArcangel.colorHex}22 0%, transparent 65%)`,
          opacity: audioSettings.visualIntensity === "low" ? 0.3 : audioSettings.visualIntensity === "high" ? 0.8 : 0.5,
        }}
      />

      {/* CABECERA PRINCIPAL / CARRUSEL DE LOS 7 ARCÁNGELES */}
      <header className="bg-neutral-950/90 backdrop-blur-md border-b border-neutral-900 sticky top-0 z-50 px-4 py-3 shadow-2xl">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-bold flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Los Siete Rayos Celestiales</span>
            </p>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{
                color: selectedArcangel.colorHex,
                borderColor: `${selectedArcangel.colorHex}55`,
                backgroundColor: `${selectedArcangel.colorHex}15`,
              }}
            >
              {selectedArcangel.dia} • {selectedArcangel.pestaña_1_altar.canal2_hz_base} Hz
            </span>
          </div>

          {/* Selector carrusel con los 7 arcángeles */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-neutral-800 justify-start sm:justify-center">
            {archangelsData.map((arcangel) => {
              const isSelected = selectedArcangel.id === arcangel.id;
              return (
                <button
                  key={arcangel.id}
                  id={`btn-select-archangel-${arcangel.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedArcangel(arcangel);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide border whitespace-nowrap transition-all duration-300 flex items-center space-x-1.5 shrink-0 ${
                    isSelected
                      ? "border-transparent text-neutral-950 font-black scale-105 shadow-lg"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                  }`}
                  style={{
                    backgroundColor: isSelected ? arcangel.colorHex : undefined,
                    boxShadow: isSelected ? `0 0 16px ${arcangel.colorHex}88` : undefined,
                  }}
                >
                  <span className={isSelected ? "text-neutral-950" : "text-neutral-400"}>
                    {getArchangelIcon(arcangel.id)}
                  </span>
                  <span>{arcangel.nombre.replace("Arcángel ", "").replace("San ", "")}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* CUERPO CENTRAL DE LA APLICACIÓN */}
      <main
        className={`max-w-xl mx-auto px-4 mt-6 space-y-6 relative z-10 transition-opacity duration-500 ${
          audioSettings.fullscreenMode ? "opacity-25 hover:opacity-100" : "opacity-100"
        }`}
      >
        {/* REPRODUCTOR MULTIMEDIA PRINCIPAL CON IMAGEN Y HZ */}
        <AudioPlayer arcangel={selectedArcangel} settings={audioSettings} />

        {/* MENÚ DE PESTAÑAS (TABS DE NAVEGACIÓN INFORMATIVA) */}
        <div className="flex bg-neutral-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-neutral-900 text-xs font-semibold shadow-md overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("altar")}
            className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === "altar"
                ? "bg-neutral-900 text-white border border-neutral-800 shadow"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Altar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("conocimiento")}
            className={`flex-1 min-w-[105px] py-2.5 rounded-xl text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === "conocimiento"
                ? "bg-neutral-900 text-white border border-neutral-800 shadow"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Conocimiento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("correspondencias")}
            className={`flex-1 min-w-[125px] py-2.5 rounded-xl text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === "correspondencias"
                ? "bg-neutral-900 text-white border border-neutral-800 shadow"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Correspondencias</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ajustes")}
            className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-center transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === "ajustes"
                ? "bg-neutral-900 text-white border border-neutral-800 shadow"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Ajustes</span>
          </button>
        </div>

        {/* CONTENEDOR DINÁMICO DE PESTAÑAS */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5 sm:p-6 shadow-2xl min-h-[220px]">
          {/* TAB 1: ALTAR DIGITAL (ORACIÓN Y TELEPRÓMPTER) */}
          {activeTab === "altar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300 font-sacred">
                    Oración Suprema de Invocación
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {selectedArcangel.nombre} • {selectedArcangel.ray}
                  </p>
                </div>

                {/* Alternador de vista: Oración pura vs Teleprómpter interactivo */}
                <div className="flex items-center space-x-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setAltarViewMode("oracion")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                      altarViewMode === "oracion"
                        ? "bg-neutral-800 text-white shadow-xs"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>Texto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAltarViewMode("teleprompter")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                      altarViewMode === "teleprompter"
                        ? "bg-amber-500 text-neutral-950 font-bold shadow-xs"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Teleprómpter</span>
                  </button>
                </div>
              </div>

              {altarViewMode === "oracion" ? (
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-neutral-200 bg-neutral-900/50 p-4 sm:p-5 rounded-2xl border border-neutral-800/80 font-serif italic text-center">
                    "{selectedArcangel.pestaña_1_altar.oracion_texto}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pt-1">
                    <span>Voz sugerida: {selectedArcangel.pestaña_1_altar.defaultTone}</span>
                    <span className="font-mono text-amber-400/90">Frecuencia: {selectedArcangel.pestaña_1_altar.canal2_frecuencia_recommended}</span>
                  </div>
                </div>
              ) : (
                <div className="pt-1">
                  <p className="text-xs text-neutral-400 mb-3">
                    Guía contemplativa verso por verso con intervalos sagrados de silencio:
                  </p>
                  <PrayerTeleprompter
                    segments={selectedArcangel.pestaña_1_altar.segments}
                    currentActiveId={null}
                    isPlaying={false}
                    onPreviewSegment={(seg) => {
                      if (seg.text) {
                        speakSampleFemaleVoice(
                          audioSettings.browserVoiceName,
                          audioSettings.voicePitch || 1.15,
                          audioSettings.voiceSpeed || 0.85,
                          seg.text
                        );
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONOCIMIENTO METAFÍSICO */}
          {activeTab === "conocimiento" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-1.5 font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedArcangel.colorHex }} />
                  <span>Aspecto Metafísico y Cualidades</span>
                </h4>
                <p className="text-sm text-neutral-200 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800">
                  {selectedArcangel.aspecto_metafisico}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                  Misión Sagrada
                </h4>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {selectedArcangel.pestaña_2_conocimiento.mision}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
                  Historia y Tradición
                </h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {selectedArcangel.pestaña_2_conocimiento.history}
                </p>
              </div>

              <div className="border-t border-neutral-900 pt-3">
                <h4 className="text-xs uppercase tracking-wider text-neutral-400 mb-1 font-bold">
                  Sabiduría de los Maestros Ascendidos
                </h4>
                <p className="text-xs text-amber-400/90 leading-relaxed italic bg-amber-950/20 p-3 rounded-xl border border-amber-900/40">
                  {selectedArcangel.aval_maestros}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CORRESPONDENCIAS METAFÍSICAS */}
          {activeTab === "correspondencias" && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                <span className="text-neutral-400 flex items-center space-x-2">
                  <span>🕯️</span>
                  <span>Vela Sagrada:</span>
                </span>
                <span className="font-semibold" style={{ color: selectedArcangel.colorHex }}>
                  {selectedArcangel.pestaña_3_correspondencias.vela}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                <span className="text-neutral-400 flex items-center space-x-2">
                  <span>💎</span>
                  <span>Cristal Guardián:</span>
                </span>
                <span className="text-neutral-200 font-medium">
                  {selectedArcangel.pestaña_3_correspondencias.cristal}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                <span className="text-neutral-400 flex items-center space-x-2">
                  <span>🌿</span>
                  <span>Aroma / Incienso:</span>
                </span>
                <span className="text-neutral-300">
                  {selectedArcangel.pestaña_3_correspondencias.aroma}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                <span className="text-neutral-400 flex items-center space-x-2">
                  <span>🎼</span>
                  <span>Llave Tonal Clásica:</span>
                </span>
                <span className="text-neutral-300 text-xs text-right max-w-[220px]">
                  {selectedArcangel.pestaña_3_correspondencias.llave_tonal}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
                <span className="text-neutral-400 flex items-center space-x-2">
                  <span>⚖️</span>
                  <span>Complemento Femenino:</span>
                </span>
                <span className="text-amber-300 font-medium">
                  {selectedArcangel.pestaña_3_correspondencias.complemento_femenino}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-400 flex items-center space-x-2">
                  <span>✨</span>
                  <span>Efecto Visual del Rayo:</span>
                </span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-md border"
                  style={{
                    color: selectedArcangel.colorHex,
                    borderColor: `${selectedArcangel.colorHex}40`,
                    backgroundColor: `${selectedArcangel.colorHex}15`,
                  }}
                >
                  {selectedArcangel.pestaña_3_correspondencias.efecto_visual}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: AJUSTES AVANZADOS */}
          {activeTab === "ajustes" && (
            <VoiceSettings settings={audioSettings} onSettingsChange={handleSettingsChange} />
          )}
        </div>

        {/* Muestra panel de configuraciones avanzadas si no está en pestaña de ajustes */}
        {activeTab !== "ajustes" && (
          <div className="pt-2">
            <VoiceSettings settings={audioSettings} onSettingsChange={handleSettingsChange} />
          </div>
        )}

        {/* Footer sagrado */}
        <footer className="pt-6 pb-4 text-center space-y-2 border-t border-neutral-900">
          <p className="text-xs text-neutral-400 max-w-lg mx-auto leading-relaxed italic">
            «Que la presencia de los Siete Arcángeles y sus Rayos de Luz iluminen, protejan y armonicen tu vida en perfecta paz divina. Amén.»
          </p>
          <p className="text-[11px] text-neutral-400 font-mono">
            Siete Rayos • Dual Channel Audio • Solfeggio Hz • Audio Ducking
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
