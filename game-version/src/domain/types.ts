export type PanelId = "diary" | "guide" | "skills" | "achievements" | "hero" | "novel";

export type Weather = "not-recorded" | "sunny" | "cloudy" | "rainy" | "snowy" | "foggy" | "stormy";

export interface Skill {
  id: string;
  name: string;
  progress: number;
  evidence: string[];
}

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  weather: Weather;
  skillId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DiaryInput = Pick<DiaryEntry, "date" | "title" | "body" | "weather" | "skillId">;

export interface RoomAtmosphere {
  weather: Weather;
  sourceEntryId: string | null;
  sourceDate: string | null;
  revision: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  confirmed: boolean;
}

export interface GuideMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  mode?: "openai" | "local";
}

export interface LifeNovelChapter {
  id: string;
  title: string;
  period: string;
  body: string;
  approved: boolean;
  updatedAt: string;
}

export interface HeroProfile {
  name: string;
  gender: "female" | "male";
  currentTheme: string;
  reflection: string;
}

export interface LifeRoomData {
  hero: HeroProfile;
  skills: Skill[];
  diary: DiaryEntry[];
  achievements: Achievement[];
  guideMessages: GuideMessage[];
  chapters: LifeNovelChapter[];
  atmosphere: RoomAtmosphere;
}
