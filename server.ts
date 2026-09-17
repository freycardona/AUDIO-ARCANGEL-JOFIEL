import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialization for Gemini SDK
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "La clave de API de Gemini (GEMINI_API_KEY) no está configurada en las variables de entorno."
    );
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Convert 16-bit Mono 24kHz PCM to WAV Buffer
function pcmToWav(
  pcmData: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

export interface ScriptSegment {
  id: string;
  type: "speech" | "pause";
  text?: string;
  pauseSeconds?: number;
  toneInstruction?: string;
  isWhisper?: boolean;
}

// Default prayer segments parsed exactly from user's prompt
export const DEFAULT_PRAYER_SEGMENTS: ScriptSegment[] = [
  {
    id: "seg-1",
    type: "speech",
    text: "Amado Arcángel Jofiel…",
    toneInstruction:
      "Tono de voz: Cálido, suave, profundamente sereno y pausado. Pronunciación clara y cercana en español latinoamericano, manteniendo una intensidad baja y envolvente.",
  },
  { id: "seg-2", type: "pause", pauseSeconds: 3 },
  {
    id: "seg-3",
    type: "speech",
    text: "portador de la luz divina y la sabiduría de Dios…",
    toneInstruction:
      "Sereno, solemne, con reverencia y dulzura en español latinoamericano.",
  },
  { id: "seg-4", type: "pause", pauseSeconds: 3 },
  {
    id: "seg-5",
    type: "speech",
    text: "te invoco en este momento.",
    toneInstruction: "Íntimo, pausado y con profunda calma espiritual.",
  },
  { id: "seg-6", type: "pause", pauseSeconds: 5 },
  {
    id: "seg-7",
    type: "speech",
    text: "Te pido que limpies mi mente de pensamientos negativos…",
    toneInstruction: "Suave, reflexivo, con ternura y serenidad.",
  },
  { id: "seg-8", type: "pause", pauseSeconds: 5 },
  {
    id: "seg-9",
    type: "speech",
    text: "dudas…",
    toneInstruction: "Pausado, contemplativo, voz baja y cristalina.",
  },
  { id: "seg-10", type: "pause", pauseSeconds: 3 },
  {
    id: "seg-11",
    type: "speech",
    text: "o confusión.",
    toneInstruction: "Sereno, aliviado, con paz interior.",
  },
  { id: "seg-12", type: "pause", pauseSeconds: 5 },
  {
    id: "seg-13",
    type: "speech",
    text: "Te ruego que me concedas claridad mental…",
    toneInstruction: "Luminoso, cálido, sincero y pausado.",
  },
  { id: "seg-14", type: "pause", pauseSeconds: 5 },
  {
    id: "seg-15",
    type: "speech",
    text: "discernimiento…",
    toneInstruction: "Pausado, sabio, suave y sereno.",
  },
  { id: "seg-16", type: "pause", pauseSeconds: 3 },
  {
    id: "seg-17",
    type: "speech",
    text: "y la gracia de ver la belleza en todo lo que me rodea.",
    toneInstruction: "Envolvente, lleno de gratitud y dulce sosiego.",
  },
  { id: "seg-18", type: "pause", pauseSeconds: 7 },
  {
    id: "seg-19",
    type: "speech",
    text: "Ayúdame a tomar decisiones justas…",
    toneInstruction: "Calmo, confiado, humilde y apacible.",
  },
  { id: "seg-20", type: "pause", pauseSeconds: 5 },
  {
    id: "seg-21",
    type: "speech",
    text: "a encontrar paz en el caos…",
    toneInstruction: "Profundamente reconfortante, suave y pausado.",
  },
  { id: "seg-22", type: "pause", pauseSeconds: 5 },
  {
    id: "seg-23",
    type: "speech",
    text: "y a despertar la chispa del conocimiento en mi ser.",
    toneInstruction: "Inspirador pero sosegado, con calidez luminosa.",
  },
  { id: "seg-24", type: "pause", pauseSeconds: 7 },
  {
    id: "seg-25",
    type: "speech",
    text: "Gracias por guiar mis pasos…",
    toneInstruction: "Profunda devoción y agradecimiento sincero.",
  },
  { id: "seg-26", type: "pause", pauseSeconds: 5 },
  {
    id: "seg-27",
    type: "speech",
    text: "y llenar mi vida de armonía.",
    toneInstruction: "Pleno, sereno, apaciguador.",
  },
  { id: "seg-28", type: "pause", pauseSeconds: 5 },
  {
    id: "seg-29",
    type: "speech",
    text: "Amén…",
    toneInstruction:
      "Susurrado suavemente con devoción y paz absoluta, casi un aliento místico.",
    isWhisper: true,
  },
  { id: "seg-30", type: "pause", pauseSeconds: 9 }, // Silencio prolongado de 8 a 10 segundos
];

// Helper to parse arbitrary text into segments with pauses
function parsePrayerText(rawText: string, generalTone: string): ScriptSegment[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const segments: ScriptSegment[] = [];
  let currentSpeechLines: string[] = [];

  const flushSpeech = () => {
    if (currentSpeechLines.length > 0) {
      const text = currentSpeechLines.join(" ");
      const isWhisper = /susurr/i.test(text);
      segments.push({
        id: `seg-${segments.length + 1}`,
        type: "speech",
        text: text.replace(/\(susurrado[^)]*\)/gi, "").trim(),
        toneInstruction: generalTone,
        isWhisper,
      });
      currentSpeechLines = [];
    }
  };

  for (const line of lines) {
    // Check if line is general tone directive in parentheses at top
    if (/^\(Tono de voz:/i.test(line)) {
      continue;
    }

    // Check pause patterns: e.g. (Pausa de 3 segundos), (Silencio prolongado de 8 a 10 segundos)
    const pauseMatch = line.match(/\((?:Pausa|Silencio|Espera)(?:\s+prolongado)?(?:\s+de)?\s+(\d+)(?:\s+a\s+(\d+))?\s+segundos?\)/i);
    if (pauseMatch) {
      flushSpeech();
      const minSec = parseInt(pauseMatch[1], 10);
      const maxSec = pauseMatch[2] ? parseInt(pauseMatch[2], 10) : minSec;
      const pauseSec = Math.round((minSec + maxSec) / 2);
      segments.push({
        id: `seg-${segments.length + 1}`,
        type: "pause",
        pauseSeconds: pauseSec,
      });
      continue;
    }

    // Check if line itself contains a pause directive inside it
    if (/^\([^)]*\)$/.test(line) && /segundo/i.test(line)) {
      flushSpeech();
      const num = parseInt(line.replace(/\D/g, ""), 10) || 5;
      segments.push({
        id: `seg-${segments.length + 1}`,
        type: "pause",
        pauseSeconds: num,
      });
      continue;
    }

    // Otherwise speech text
    currentSpeechLines.push(line);
  }

  flushSpeech();
  return segments.length > 0 ? segments : DEFAULT_PRAYER_SEGMENTS;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    defaultSegmentsCount: DEFAULT_PRAYER_SEGMENTS.length,
  });
});

app.get("/api/voices", (_req, res) => {
  res.json({
    voices: [
      {
        id: "Aoede",
        name: "Aoede (Voz Latina Serena y Dulce)",
        gender: "Femenina Latina",
        description: "Cálida, dulce y maternal con cadencia latina fluida, apacible y reconfortante.",
        recommended: true,
      },
      {
        id: "Kore",
        name: "Kore (Voz Latina Mística y Cálida)",
        gender: "Femenina Latina",
        description: "Suave, íntima y de intensidad baja, perfecta para la meditación profunda.",
        recommended: false,
      },
      {
        id: "Puck",
        name: "Puck (Voz Latina Clara y Pacífica)",
        gender: "Masculina Latina",
        description: "Tono claro, cercano y sereno con acento latino neutro.",
        recommended: false,
      },
      {
        id: "Charon",
        name: "Charon (Voz Latina Profunda y Solemne)",
        gender: "Masculina Latina",
        description: "Gravedad pacífica, solemne y meditativa con cadencia profunda.",
        recommended: false,
      },
      {
        id: "Fenrir",
        name: "Fenrir (Voz Latina Noble y Calma)",
        gender: "Masculina Latina",
        description: "Seguridad apacible, respeto y templanza serena.",
        recommended: false,
      },
    ],
  });
});

// Synthesize a single speech segment using Gemini TTS
async function synthesizeSegment(
  text: string,
  toneInstruction: string,
  voiceName: string,
  isWhisper = false
): Promise<Buffer> {
  const ai = getGeminiClient();

  const prompt = isWhisper
    ? `INSTRUCCIÓN DE LOCUCIÓN: Susurra con infinita devoción, paz sagrada, calidez y ternura en auténtico español latinoamericano (acento neutro con seseo suave, sin ceceo). Di únicamente: "${text}"`
    : `INSTRUCCIÓN DE LOCUCIÓN: Actúa como una locutora o locutor nativo de español latinoamericano (acento neutro latinoamericano con seseo natural para 's', 'c' y 'z', sin ceceo de España). ${toneInstruction}. Tono cálido, suave, profundamente sereno y pausado. Di únicamente el siguiente texto sagrado sin agregar palabras extras: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    config: {
      // @ts-ignore
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName || "Aoede" },
        },
      },
    },
  });

  const base64Data =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Data) {
    throw new Error(
      `No se recibieron datos de audio para el segmento: "${text}".`
    );
  }

  return Buffer.from(base64Data, "base64");
}

// Endpoint to generate full unified prayer audio in 1 single Gemini TTS call
app.post("/api/tts/generate-full", async (req, res) => {
  try {
    const {
      text,
      tone = "Tono de voz: Cálido, suave, profundamente sereno y pausado. Pronunciación auténtica en español latinoamericano (acento latino neutro con seseo suave, sin ceceo), manteniendo una intensidad baja, íntima y envolvente",
      voice = "Aoede",
      mode = "unified", // "unified" uses 1 call (immune to 3 RPM quota); "stitched" uses segments
    } = req.body;

    const prayerScript = text || `Amado Arcángel Jofiel…
portador de la luz divina y la sabiduría de Dios…
te invoco en este momento.
Te pido que limpies mi mente de pensamientos negativos…
dudas…
o confusión.
Te ruego que me concedas claridad mental…
discernimiento…
y la gracia de ver la belleza en todo lo que me rodea.
Ayúdame a tomar decisiones justas…
a encontrar paz en el caos…
y a despertar la chispa del conocimiento en mi ser.
Gracias por guiar mis pasos…
y llenar mi vida de armonía.
Amén…`;

    const ai = getGeminiClient();

    // 1-call prompt specifically engineered for sacred prayer with pauses in Latin American accent
    const prompt = `INSTRUCCIÓN OBLIGATORIA DE VOZ Y LOCUCIÓN:
Habla con una auténtica voz latina en español latinoamericano neutro.
- Acento y Fonética: 100% Latinoamericano (acento neutro de América Latina, con seseo natural: pronuncia suavemente las 'c', 'z' y 's' como sonido de s latina; jamás utilices ceceo ibérico ni modismos de España).
- Emoción y Calidez: ${tone}
- Cadencia: Pausada, reflexiva y serena. Haz pausas tranquilas y sentidas de silencio entre cada verso u oración.
- Verso final: Pronuncia la última palabra "Amén" en un susurro sumamente dulce, reverente y lleno de paz espiritual.

Texto sagrado para locución:
${prayerScript}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      config: {
        // @ts-ignore
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Aoede" },
          },
        },
      },
    });

    const base64Data =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Data) {
      throw new Error(
        "No se recibieron datos de audio del modelo de Gemini TTS."
      );
    }

    const pcmBuffer = Buffer.from(base64Data, "base64");
    const sampleRate = 24000;
    const wavBuffer = pcmToWav(pcmBuffer, sampleRate, 1, 16);
    const duration = pcmBuffer.length / (sampleRate * 2);
    const audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;

    // Generate balanced timeline marks across the segments
    const speechSegments = DEFAULT_PRAYER_SEGMENTS.filter(
      (s) => s.type === "speech"
    );
    const timePerSegment = duration / Math.max(1, speechSegments.length);
    const timelineMarks = speechSegments.map((s, idx) => ({
      id: s.id,
      type: "speech" as const,
      text: s.text,
      startTime: idx * timePerSegment,
      duration: timePerSegment,
      isWhisper: s.isWhisper,
    }));

    res.json({
      success: true,
      audioUrl: audioDataUrl,
      duration,
      sampleRate,
      timeline: timelineMarks,
      totalSize: wavBuffer.length,
      voice,
    });
  } catch (error: any) {
    console.error("Error generating full TTS audio:", error);
    let userMsg = error.message || "Error al generar el audio de la oración.";

    if (userMsg.includes("429") || userMsg.includes("quota")) {
      const match = userMsg.match(/retry in ([\d\.]+)s/i);
      const delay = match ? Math.ceil(parseFloat(match[1])) : 45;
      userMsg = `Límite temporal de cuota por minuto alcanzado. Por favor espera ${delay} segundos o utiliza la opción "Voz Directa Inmediata".`;
    }

    res.status(500).json({
      success: false,
      error: userMsg,
    });
  }
});

// Endpoint to generate a single segment (useful for progressive rendering)
app.post("/api/tts/generate-segment", async (req, res) => {
  try {
    const {
      text,
      tone = "Tono de voz: Cálido, suave, profundamente sereno y pausado. Pronunciación clara y cercana en español latinoamericano, manteniendo una intensidad baja y envolvente",
      voice = "Kore",
      isWhisper = false,
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: "El texto es requerido" });
    }

    const pcm = await synthesizeSegment(text, tone, voice, Boolean(isWhisper));
    const wav = pcmToWav(pcm, 24000, 1, 16);
    const base64Wav = wav.toString("base64");

    res.json({
      success: true,
      audioUrl: `data:audio/wav;base64,${base64Wav}`,
      duration: pcm.length / 48000,
    });
  } catch (error: any) {
    console.error("Error in generate-segment:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al sintetizar el segmento.",
    });
  }
});

// ----------------------------------------------------
// SERVER & VITE INTEGRATION
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
