export type PanelId =
  | "novel"
  | "diary"
  | "quests"
  | "todos"
  | "guide"
  | "skills"
  | "hero"
  | "calendar"
  | "achievements";

export type TodoStatus = "open" | "done" | "archived";

export interface Todo {
  id: string;
  title: string;
  status: TodoStatus;
  originalScheduledDate: string;
  scheduledDate: string;
  mainQuestId?: string;
  skillId?: string;
  completedAt?: string;
  carryoverCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MainQuest {
  id: string;
  title: string;
  intention: string;
  progress: number;
  active: boolean;
}

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
  todoId?: string;
  skillId?: string;
  questId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
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
  pronouns: string;
  currentTheme: string;
  reflection: string;
}

export interface LifeRoomData {
  hero: HeroProfile;
  todos: Todo[];
  quests: MainQuest[];
  skills: Skill[];
  diary: DiaryEntry[];
  events: CalendarEvent[];
  annotations: Record<string, string>;
  achievements: Achievement[];
  guideMessages: GuideMessage[];
  chapters: LifeNovelChapter[];
}
