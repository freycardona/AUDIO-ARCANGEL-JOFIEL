import { ScriptSegment } from "../types";

export interface BrowserPlaybackHandlers {
  onSegmentChange: (segmentId: string, isPause: boolean, pauseRemaining?: number) => void;
  onEnded: () => void;
  onError: (error: string) => void;
}

// Helper to find the best native Latin American Spanish voice available in the browser
export function getBestLatinVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Explicit Latin American locales in priority order (Mexico, Colombia, US Spanish, Latin generic, Argentina, Chile, Peru)
  const latinCodes = [
    "es-mx",
    "es-419",
    "es-co",
    "es-us",
    "es-ar",
    "es-cl",
    "es-pe",
    "es-cr",
    "es-ve",
    "es-gt",
  ];

  // 2. Names of famous Latin American voices
  const latinNames = [
    "sabina",
    "dalia",
    "paulina",
    "soledad",
    "francisca",
    "diego",
    "jorge",
    "gonzalo",
    "lupe",
    "carlos",
    "miguel",
    "latino",
    "méxico",
    "mexico",
    "colombia",
  ];

  // First check matching locale
  for (const code of latinCodes) {
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(code));
    if (match) return match;
  }

  // Next check matching voice name in Spanish
  const nameMatch = voices.find((v) => {
    const l = v.lang.toLowerCase();
    const n = v.name.toLowerCase();
    return l.startsWith("es") && latinNames.some((lat) => n.includes(lat));
  });
  if (nameMatch) return nameMatch;

  // Fallback: any Spanish voice that is NOT es-ES (Spain)
  const nonSpainEs = voices.find(
    (v) => v.lang.toLowerCase().startsWith("es") && !v.lang.toLowerCase().includes("es-es")
  );
  if (nonSpainEs) return nonSpainEs;

  // Ultimate fallback to any Spanish voice
  return voices.find((v) => v.lang.toLowerCase().startsWith("es")) || voices[0] || null;
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
    handlers: BrowserPlaybackHandlers
  ) {
    this.stop();
    this.isCancelled = false;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      handlers.onError("Tu navegador no soporta síntesis de voz Web Speech.");
      return;
    }

    // Force voice list resolution if needed
    let esVoice = getBestLatinVoice();
    if (!esVoice && window.speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          window.speechSynthesis.removeEventListener("voiceschanged", handler);
          resolve();
        };
        window.speechSynthesis.addEventListener("voiceschanged", handler);
        setTimeout(resolve, 500); // safety fallback
      });
      esVoice = getBestLatinVoice();
    }

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
          utterance.rate = 0.85; // Serene, meditative tempo
          utterance.pitch = seg.isWhisper ? 0.75 : 0.95; // Warm pitch
          utterance.volume = seg.isWhisper ? 0.45 : 0.85;

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
