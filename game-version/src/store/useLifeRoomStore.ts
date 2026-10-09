"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey } from "@/domain/dates";
import { commitDiary } from "@/domain/diary";
import type {
  Achievement, DiaryInput, GuideMessage, HeroProfile, LifeNovelChapter, LifeRoomData, Skill,
} from "@/domain/types";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const DEFAULT_HERO: HeroProfile = {
  name: "The Dreamer",
  gender: "female",
  currentTheme: "Learning to notice the life I am already living",
  reflection: "I want this room to hold evidence of patient growth.",
};

function normalizeHero(hero?: Partial<HeroProfile>): HeroProfile {
  return {
    name: typeof hero?.name === "string" ? hero.name : DEFAULT_HERO.name,
    gender: hero?.gender === "male" ? "male" : "female",
    currentTheme: typeof hero?.currentTheme === "string" ? hero.currentTheme : DEFAULT_HERO.currentTheme,
    reflection: typeof hero?.reflection === "string" ? hero.reflection : DEFAULT_HERO.reflection,
  };
}

export const GAME_STORAGE_KEY = "life-as-a-room-game-v1";
const GAME_STORAGE_VERSION = 1;

function initialData(): LifeRoomData {
  return {
    hero: { ...DEFAULT_HERO },
    skills: [{ id: "skill-reflection", name: "Reflection", progress: 0, evidence: [] }],
    diary: [],
    achievements: [],
    guideMessages: [{
      id: "guide-welcome", role: "assistant",
      content: "I am here in the mirror, to notice with you. Tell me about a moment, or save it in your diary and let its weather light the room.",
      createdAt: now(), mode: "local",
    }],
    chapters: [],
    atmosphere: { weather: "not-recorded", sourceEntryId: null, sourceDate: null, revision: 0 },
  };
}

interface LifeRoomActions {
  setHero: (hero: HeroProfile) => void;
  addSkill: (name: string) => void;
  updateSkill: (skillId: string, patch: Partial<Skill>) => void;
  addDiary: (input: DiaryInput) => void;
  updateDiary: (entryId: string, input: DiaryInput) => void;
  addAchievement: (input: Pick<Achievement, "title" | "description"> & Partial<Achievement>) => void;
  confirmAchievement: (achievementId: string) => void;
  addGuideMessage: (message: Omit<GuideMessage, "id" | "createdAt">) => void;
  saveChapter: (chapter: Omit<LifeNovelChapter, "id" | "updatedAt"> & { id?: string }) => void;
  resetDemo: () => void;
}
export type LifeRoomStore = LifeRoomData & LifeRoomActions;

export function snapshotData(state: LifeRoomData): LifeRoomData {
  return {
    hero: normalizeHero(state.hero), skills: state.skills, diary: state.diary,
    achievements: state.achievements, guideMessages: state.guideMessages,
    chapters: state.chapters, atmosphere: state.atmosphere,
  };
}

export const useLifeRoomStore = create<LifeRoomStore>()(
  persist<LifeRoomStore, [], [], LifeRoomData>(
    (set, get) => {
      // Check persistence before changing the visible room; keep drafts on storage failure.
      const saveDiary = (input: DiaryInput, entryId = id(), editing = false) => {
        const state = get();
        const change = commitDiary(state, input, entryId, now(), editing);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({
            state: snapshotData({ ...state, ...change }), version: GAME_STORAGE_VERSION,
          }));
        }
        set(change);
      };
      return {
        ...initialData(),
        setHero: (hero) => set({ hero: normalizeHero(hero) }),
        addSkill: (name) => set((state) => ({
          skills: [...state.skills, { id: id(), name: name.trim(), progress: 0, evidence: [] }],
        })),
        updateSkill: (skillId, patch) => set((state) => ({
          skills: state.skills.map((skill) => skill.id === skillId
            ? { ...skill, ...patch, progress: Math.max(0, Math.min(100, patch.progress ?? skill.progress)) }
            : skill),
        })),
        addDiary: (input) => saveDiary(input),
        updateDiary: (entryId, input) => saveDiary(input, entryId, true),
        addAchievement: (input) => set((state) => ({
          achievements: [{
            id: id(), title: input.title, description: input.description,
            date: input.date ?? todayKey(), confirmed: input.confirmed ?? false,
          }, ...state.achievements],
        })),
        confirmAchievement: (achievementId) => set((state) => ({
          achievements: state.achievements.map((item) => item.id === achievementId ? { ...item, confirmed: true } : item),
        })),
        addGuideMessage: (message) => set((state) => ({
          guideMessages: [...state.guideMessages, { ...message, id: id(), createdAt: now() }],
        })),
        saveChapter: (chapter) => set((state) => {
          const item: LifeNovelChapter = { ...chapter, id: chapter.id ?? id(), updatedAt: now() };
          return {
            chapters: state.chapters.some((entry) => entry.id === item.id)
              ? state.chapters.map((entry) => entry.id === item.id ? item : entry)
              : [item, ...state.chapters],
          };
        }),
        resetDemo: () => set(initialData()),
      };
    },
    {
      name: GAME_STORAGE_KEY,
      version: GAME_STORAGE_VERSION,
      partialize: snapshotData,
      migrate: (persisted) => {
        const records = persisted as Partial<LifeRoomData> | undefined;
        return { ...initialData(), ...records, hero: normalizeHero(records?.hero) };
      },
      merge: (persisted, current) => {
        const records = persisted as Partial<LifeRoomData> | undefined;
        return { ...current, ...records, hero: normalizeHero(records?.hero) };
      },
    },
  ),
);

export function getLifeRoomSnapshot(): LifeRoomData {
  return snapshotData(useLifeRoomStore.getState());
}
