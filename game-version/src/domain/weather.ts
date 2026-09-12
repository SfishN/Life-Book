import type { Weather } from "./types";

export interface WeatherPreset {
  label: string;
  description: string;
  tint: number;
  ambientColor: number;
  ambientAlpha: number;
  windowColor: number;
  windowAlpha: number;
  lampAlpha: number;
}

export const WEATHER_PRESETS: Record<Weather, WeatherPreset> = {
  "not-recorded": {
    label: "Not recorded", description: "Keep the room's gentle, neutral light.",
    tint: 0xffffff, ambientColor: 0xf6dfc1, ambientAlpha: 0.02,
    windowColor: 0xffe5ba, windowAlpha: 0.12, lampAlpha: 0.20,
  },
  sunny: {
    label: "Sunny", description: "Golden window light and a brighter, warm room.",
    tint: 0xfff0d1, ambientColor: 0xffcf79, ambientAlpha: 0.08,
    windowColor: 0xffdb82, windowAlpha: 0.52, lampAlpha: 0.12,
  },
  cloudy: {
    label: "Cloudy", description: "Soft, muted daylight and gentle shadows.",
    tint: 0xd5deed, ambientColor: 0x71839e, ambientAlpha: 0.13,
    windowColor: 0xd6e2f6, windowAlpha: 0.16, lampAlpha: 0.24,
  },
  rainy: {
    label: "Rainy", description: "Cool blue daylight with a warmer pool of lamplight.",
    tint: 0xa8c4e9, ambientColor: 0x354e7b, ambientAlpha: 0.23,
    windowColor: 0x92b9ee, windowAlpha: 0.20, lampAlpha: 0.48,
  },
  snowy: {
    label: "Snowy", description: "Pale, reflected light and a softly glowing lamp.",
    tint: 0xe4f3ff, ambientColor: 0xe2f2ff, ambientAlpha: 0.16,
    windowColor: 0xe7f8ff, windowAlpha: 0.48, lampAlpha: 0.27,
  },
  foggy: {
    label: "Foggy", description: "Diffused silver light with softer contrast.",
    tint: 0xd4dfdf, ambientColor: 0xc3ced0, ambientAlpha: 0.23,
    windowColor: 0xdce6e6, windowAlpha: 0.24, lampAlpha: 0.30,
  },
  stormy: {
    label: "Stormy", description: "Deeper violet-blue light and a steady warm lamp. No flashes.",
    tint: 0x98a4cc, ambientColor: 0x302c58, ambientAlpha: 0.29,
    windowColor: 0x9fabe3, windowAlpha: 0.10, lampAlpha: 0.58,
  },
};

export const WEATHER_OPTIONS = Object.entries(WEATHER_PRESETS).map(([value, preset]) => ({
  value: value as Weather, ...preset,
}));

export function normalizeWeather(value: unknown): Weather {
  return typeof value === "string" && Object.hasOwn(WEATHER_PRESETS, value)
    ? value as Weather
    : "not-recorded";
}

export function getWeatherPreset(value: unknown): WeatherPreset {
  return WEATHER_PRESETS[normalizeWeather(value)];
}
