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

export type MeditationTrackId = "luz-dorada-432" | "sanacion-528" | "paz-396" | "intuicion-852";
