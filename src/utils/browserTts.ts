import { ScriptSegment } from "../types";

export interface BrowserPlaybackHandlers {
  onSegmentChange: (segmentId: string, isPause: boolean, pauseRemaining?: number) => void;
  onEnded: () => void;
  onError: (error: string) => void;
}

// Explicit male names/keywords to strictly reject
const MALE_NAMES = [
  "diego", "jorge", "gonzalo", "carlos", "miguel", "raul", "raúl",
  "pablo", "alvaro", "álvaro", "enrique", "male", "hombre", "masculino",
  "david", "julio", "manuel", "fernando", "pedro", "jose", "josé",
  "juan", "paco", "mateo", "santiago", "hector", "héctor", "antonio",
  "mario", "ricardo", "alberto", "javier", "luis"
];

// Explicit female Latin names and keywords
const FEMALE_LATIN_NAMES = [
  "sabina", "paulina", "dalia", "lupe", "soledad", "francisca",
  "monica", "mónica", "elena", "helena", "camila", "sofia", "sofía",
  "lucia", "lucía", "salma", "penelope", "penélope", "valentina",
  "paloma", "victoria", "jimena", "zira", "female", "mujer", "femenina",
  "hilda", "esperanza", "marina", "laura", "carmen", "clara"
];

// Latin American country codes in priority
const LATIN_CODES = [
  "es-419", // Español Latinoamericano neutro
  "es-mx",  // México
  "es-co",  // Colombia
  "es-us",  // Estados Unidos (español latino)
  "es-ar",  // Argentina
  "es-cl",  // Chile
  "es-pe",  // Perú
  "es-cr",  // Costa Rica
  "es-ve",  // Venezuela
  "es-gt",  // Guatemala
];

/**
 * Check if a voice is a high-definition natural or neural voice
 */
export function isNaturalVoice(voice: SpeechSynthesisVoice): boolean {
  const n = voice.name.toLowerCase();
  return (
    n.includes("natural") ||
    n.includes("neural") ||
    n.includes("online") ||
    n.includes("google") ||
    n.includes("siri") ||
    n.includes("premium")
  );
}

/**
 * Returns all available female Latin/Spanish voices on the device,
 * with high-quality Natural/Neural voices sorted at the top.
 */
export function getAvailableFemaleLatinVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices() || [];

  const filtered = voices.filter((v) => {
    const l = v.lang.toLowerCase();
    const n = v.name.toLowerCase();
    if (!l.startsWith("es")) return false;
    const isMale = MALE_NAMES.some((m) => n.includes(m));
    if (isMale) return false;
    return true;
  });

  // Sort natural/neural voices first
  return filtered.sort((a, b) => {
    const aNat = isNaturalVoice(a) ? 1 : 0;
    const bNat = isNaturalVoice(b) ? 1 : 0;
    return bNat - aNat;
  });
}

/**
 * Helper to find strictly the best Latin American Female voice available,
 * giving first priority to modern Natural/Neural online voices.
 */
export function getBestLatinFemaleVoice(preferredName?: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // If user selected a specific preferred voice by name
  if (preferredName) {
    const userVoice = voices.find((v) => v.name === preferredName);
    if (userVoice) return userVoice;
  }

  // Filter out any male voice explicitly
  const nonMaleEsVoices = voices.filter((v) => {
    const l = v.lang.toLowerCase();
    const n = v.name.toLowerCase();
    if (!l.startsWith("es")) return false;
    return !MALE_NAMES.some((m) => n.includes(m));
  });

  if (nonMaleEsVoices.length === 0) {
    return voices.find((v) => v.lang.toLowerCase().startsWith("es")) || voices[0] || null;
  }

  // 0. Super priority: Latin American voice that is specifically "Natural" or "Neural"
  for (const code of LATIN_CODES) {
    const naturalMatch = nonMaleEsVoices.find((v) => {
      const l = v.lang.toLowerCase();
      return l.startsWith(code) && isNaturalVoice(v);
    });
    if (naturalMatch) return naturalMatch;
  }

  // 1. First priority: Latin American Spanish voice with known female name
  for (const code of LATIN_CODES) {
    const match = nonMaleEsVoices.find((v) => {
      const l = v.lang.toLowerCase();
      const n = v.name.toLowerCase();
      return l.startsWith(code) && FEMALE_LATIN_NAMES.some((f) => n.includes(f));
    });
    if (match) return match;
  }

  // 2. Second priority: Any Latin American locale (es-419, es-mx, es-co, etc.) non-male
  for (const code of LATIN_CODES) {
    const match = nonMaleEsVoices.find((v) => v.lang.toLowerCase().startsWith(code));
    if (match) return match;
  }

  // 3. Third priority: Any Spanish voice with known female name
  const anyFemaleEs = nonMaleEsVoices.find((v) => {
    const n = v.name.toLowerCase();
    return FEMALE_LATIN_NAMES.some((f) => n.includes(f));
  });
  if (anyFemaleEs) return anyFemaleEs;

  // 4. Any non-male Spanish voice
  return nonMaleEsVoices[0];
}

// Alias for backwards compatibility
export const getBestLatinVoice = getBestLatinFemaleVoice;

export interface PlayPrayerOptions {
  preferredVoiceName?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
}

export function speakSampleFemaleVoice(
  preferredVoiceName?: string,
  pitch = 1.15,
  rate = 0.85,
  customText?: string
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const sample =
    customText ||
    "Amado ser de luz, que la paz y la sabiduría divina iluminen tu camino.";
  const utterance = new SpeechSynthesisUtterance(sample);
  const voice = getBestLatinFemaleVoice(preferredVoiceName);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || "es-419";
  } else {
    utterance.lang = "es-419";
  }
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

class BrowserTtsEngine {
  private isCancelled = false;
  private currentTimeout: any = null;

  public stop() {
    this.isCancelled = true;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  public async playPrayer(
    segments: ScriptSegment[],
    handlers: BrowserPlaybackHandlers,
    options?: PlayPrayerOptions
  ) {
    this.stop();
    this.isCancelled = false;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      handlers.onError("Tu navegador no soporta síntesis de voz Web Speech.");
      return;
    }

    // Force voice list resolution if needed
    let esVoice = getBestLatinFemaleVoice(options?.preferredVoiceName);
    if (!esVoice && window.speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          window.speechSynthesis.removeEventListener("voiceschanged", handler);
          resolve();
        };
        window.speechSynthesis.addEventListener("voiceschanged", handler);
        setTimeout(resolve, 500); // safety fallback
      });
      esVoice = getBestLatinFemaleVoice(options?.preferredVoiceName);
    }

    const basePitch = options?.pitch ?? 1.15;
    const baseRate = options?.rate ?? 0.85;
    const baseVolume = options?.volume ?? 0.9;

    for (let i = 0; i < segments.length; i++) {
      if (this.isCancelled) return;
      const seg = segments[i];

      if (seg.type === "pause") {
        const seconds = seg.pauseSeconds || 3;
        handlers.onSegmentChange(seg.id, true, seconds);

        // Countdown tick
        for (let s = seconds; s > 0; s--) {
          if (this.isCancelled) return;
          handlers.onSegmentChange(seg.id, true, s);
          await new Promise((r) => {
            this.currentTimeout = setTimeout(r, 1000);
          });
        }
      } else if (seg.type === "speech" && seg.text) {
        handlers.onSegmentChange(seg.id, false);

        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(seg.text);
          if (esVoice) {
            utterance.voice = esVoice;
            utterance.lang = esVoice.lang || "es-419";
          } else {
            utterance.lang = "es-419";
          }
          utterance.rate = baseRate;
          utterance.pitch = seg.isWhisper ? basePitch * 0.9 : basePitch;
          utterance.volume = seg.isWhisper ? baseVolume * 0.6 : baseVolume;

          utterance.onend = () => resolve();
          utterance.onerror = (e) => {
            console.warn("SpeechSynthesis error:", e);
            resolve();
          };

          window.speechSynthesis.speak(utterance);
        });
      }
    }

    if (!this.isCancelled) {
      handlers.onEnded();
    }
  }
}

export const browserTts = new BrowserTtsEngine();
