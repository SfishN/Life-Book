import type { Mood } from "./types";

export interface MoodPreset {
  label: string;
  face: string;
  description: string;
  tint: number;
  ambientColor: number;
  ambientAlpha: number;
  windowColor: number;
  windowAlpha: number;
  lampAlpha: number;
}

export const MOOD_PRESETS: Record<Mood, MoodPreset> = {
  calm: {
    label: "Calm", face: "◡", description: "Soft lavender light and a quiet lamp settle across the room.",
    tint: 0xe8e1ee, ambientColor: 0xc8b9d2, ambientAlpha: 0.12,
    windowColor: 0xe1d8eb, windowAlpha: 0.24, lampAlpha: 0.24,
  },
  happy: {
    label: "Happy", face: "⌣", description: "Golden window light makes the room feel open and warm.",
    tint: 0xffefd0, ambientColor: 0xffcf79, ambientAlpha: 0.08,
    windowColor: 0xffdb82, windowAlpha: 0.52, lampAlpha: 0.12,
  },
  neutral: {
    label: "Neutral", face: "—", description: "A balanced, gentle light keeps the room steady.",
    tint: 0xffffff, ambientColor: 0xf6dfc1, ambientAlpha: 0.02,
    windowColor: 0xffe5ba, windowAlpha: 0.12, lampAlpha: 0.20,
  },
  tired: {
    label: "Tired", face: "︵", description: "Cool daylight meets a supportive pool of lamplight.",
    tint: 0xaec7e7, ambientColor: 0x435b80, ambientAlpha: 0.21,
    windowColor: 0x9ebee7, windowAlpha: 0.18, lampAlpha: 0.48,
  },
  stressed: {
    label: "Stressed", face: "﹏", description: "Muted violet-blue light is held by a steady warm lamp.",
    tint: 0xa5a8c8, ambientColor: 0x40375f, ambientAlpha: 0.27,
    windowColor: 0xaeb3dc, windowAlpha: 0.10, lampAlpha: 0.58,
  },
};

export const MOOD_OPTIONS = Object.entries(MOOD_PRESETS).map(([value, preset]) => ({
  value: value as Mood,
  ...preset,
}));

export function normalizeMood(value: unknown): Mood {
  return typeof value === "string" && Object.hasOwn(MOOD_PRESETS, value)
    ? value as Mood
    : "neutral";
}

export function getMoodPreset(value: unknown): MoodPreset {
  return MOOD_PRESETS[normalizeMood(value)];
}
