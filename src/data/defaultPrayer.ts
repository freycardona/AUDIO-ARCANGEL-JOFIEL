import { ScriptSegment, VoiceOption } from "../types";

export const DEFAULT_RAW_PRAYER = `(Tono de voz: Cálido, suave, profundamente sereno y pausado. Pronunciación auténtica en español latinoamericano con acento latino neutro y seseo suave, manteniendo una intensidad baja y envolvente)

Amado Arcángel Jofiel…

(Pausa de 3 segundos)

portador de la luz divina

y la sabiduría de Dios…

(Pausa de 3 segundos)

te invoco en este momento.

(Pausa de 5 segundos)

Te pido que limpies mi mente

de pensamientos negativos…

(Pausa de 5 segundos)

dudas…

(Pausa de 3 segundos)

o confusión.

(Pausa de 5 segundos)

Te ruego que me concedas

claridad mental…

(Pausa de 5 segundos)

discernimiento…

(Pausa de 3 segundos)

y la gracia de ver la belleza

en todo lo que me rodea.

(Pausa de 7 segundos)

Ayúdame a tomar decisiones justas…

(Pausa de 5 segundos)

a encontrar paz en el caos…

(Pausa de 5 segundos)

y a despertar la chispa del conocimiento

en mi ser.

(Pausa de 7 segundos)

Gracias por guiar mis pasos…

(Pausa de 5 segundos)

y llenar mi vida de armonía.

(Pausa de 5 segundos)

Amén… (susurrado suavemente)

(Silencio prolongado de 8 a 10 segundos)`;

export const DEFAULT_TONE =
  "Cálido, suave, profundamente sereno y pausado. Pronunciación auténtica en español latinoamericano (acento latino neutro con seseo natural, sin ceceo), manteniendo una intensidad baja, íntima y envolvente.";

export const INITIAL_SEGMENTS: ScriptSegment[] = [
  {
    id: "seg-1",
    type: "speech",
    text: "Amado Arcángel Jofiel…",
    toneInstruction: DEFAULT_TONE,
  },
  { id: "seg-2", type: "pause", pauseSeconds: 3 },
  {
    id: "seg-3",
    type: "speech",
    text: "portador de la luz divina y la sabiduría de Dios…",
    toneInstruction: "Sereno, solemne, con reverencia y dulzura.",
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
    toneInstruction: "Susurrado suavemente con devoción y paz absoluta.",
    isWhisper: true,
  },
  { id: "seg-30", type: "pause", pauseSeconds: 9 },
];

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: "Aoede",
    name: "Aoede (Voz Latina Serena y Dulce)",
    gender: "Femenina Latina",
    description: "Cálida, dulce y maternal con cadencia latina fluida, apacible y reconfortante. Ideal para invocar la luz del Arcángel Jofiel.",
    recommended: true,
  },
  {
    id: "Kore",
    name: "Kore (Voz Latina Mística y Cálida)",
    gender: "Femenina Latina",
    description: "Suave, íntima y de intensidad baja, perfecta para la meditación profunda y recogimiento interior.",
    recommended: false,
  },
  {
    id: "Puck",
    name: "Puck (Voz Latina Clara y Pacífica)",
    gender: "Masculina Latina",
    description: "Tono claro, cercano y sereno con acento latino neutro y pausado.",
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
];
