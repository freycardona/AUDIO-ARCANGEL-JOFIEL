export interface ScriptSegment {
  id: string;
  type: "speech" | "pause";
  text?: string;
  pauseSeconds?: number;
  toneInstruction?: string;
  isWhisper?: boolean;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  description: string;
  recommended?: boolean;
}

export type MeditationTrackId =
  | "frecuencia-528-miguel"
  | "luz-dorada-432"
  | "amor-639-chamuel"
  | "rayo-blanco-gabriel-741"
  | "sanacion-528-rafael"
  | "paz-396-uriel"
  | "transmutacion-417-zadkiel"
  | "solfeggio-528"
  | "cuencos-oceano"
  | "santuario-viento"
  | "custom";

export interface MeditationTrack {
  id: MeditationTrackId;
  name: string;
  subtitle: string;
  frequency: string;
  description: string;
  recommended?: boolean;
  bgGlow: string;
}

export interface TimelineMark {
  id: string;
  type: "speech" | "pause";
  text?: string;
  startTime: number;
  duration: number;
  isWhisper?: boolean;
}

export interface GeneratedAudioData {
  audioUrl: string;
  duration: number;
  sampleRate: number;
  timeline: TimelineMark[];
  voice: string;
  totalSize: number;
  generatedAt: Date;
}

export interface AdvancedAudioSettings {
  voiceVolume: number;        // 0.0 a 1.0 (Canal 1 - Narración)
  ambientVolume: number;      // 0.0 a 1.0 (Canal 2 - Frecuencias Hz)
  audioDucking: boolean;      // Atenuación automática de fondo al hablar
  infiniteLoopAmbient: boolean; // El fondo Hz sigue sonando infinitamente
  visualIntensity: "low" | "medium" | "high"; // Intensidad del rayo cósmico
  fullscreenMode: boolean;    // Modo lámpara ambiental (atenúa controles)
  femaleVoiceType: "gemini_aoede" | "gemini_kore" | "gemini_zephyr" | "browser_female"; // Tipo de voz femenina latina
  browserVoiceName?: string;   // Nombre de voz femenina del sistema elegida
  voicePitch: number;         // Tono femenino (default 1.15)
  voiceSpeed: number;         // Velocidad sosegada (default 0.85)
}

export interface Archangel {
  id: string;
  nombre: string;
  dia: string;
  colorHex: string;
  significado: string;
  imagen: string;
  aspecto_metafisico: string;
  aval_maestros: string;
  ray: string;
  badgeBg: string;
  headerGradient: string;
  pestaña_1_altar: {
    canal1_audio_url?: string;
    canal2_audio_url_recommended?: string;
    canal2_audio_url_alterno?: string;
    canal2_frecuencia_recommended: string;
    canal2_opcion_alterna_hz: string;
    canal2_hz_base: number;
    canal2_hz_alterno: number;
    oracion_texto: string;
    defaultTone: string;
    segments: ScriptSegment[];
  };
  pestaña_2_conocimiento: {
    history: string;
    mision: string;
  };
  pestaña_3_correspondencias: {
    vela: string;
    cristal: string;
    aroma: string;
    llave_tonal: string;
    complemento_femenino: string;
    efecto_visual: string;
  };
}
