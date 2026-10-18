"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey, toDateKey } from "@/domain/dates";
import { commitDiary } from "@/domain/diary";
import type {
  Achievement,
  AchievementStatus,
  AvatarStyle,
  DiaryInput,
  GuideMessage,
  HeroProfile,
  LifeNovelChapter,
  LifeRoomData,
  Skill,
  SkillRecord,
  SkillRecordInput,
  UserAttribute,
} from "@/domain/types";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const seedTime = "2026-10-17T00:00:00.000Z";

export function guideMessagesForToday(messages: GuideMessage[], date = new Date()): GuideMessage[] {
  const today = toDateKey(date);
  return messages.filter((message) => {
    const created = new Date(message.createdAt);
    return !Number.isNaN(created.getTime()) && toDateKey(created) === today;
  });
}

const DEFAULT_HERO: HeroProfile = {
  name: "The Dreamer",
  gender: "prefer-not-to-say",
  avatarStyle: "girl",
  motto: "A calmer me, a kinder day.",
  currentTheme: "Learning to notice the life I am already living",
  reflection: "I want this room to hold evidence of patient growth.",
  updatedAt: seedTime,
};

const DEFAULT_SKILLS: Skill[] = [
  ["skill-mindful", "Mindful Living", "#a8c6aa", "Try short, consistent moments of presence. Start with five minutes and notice one detail around you."],
  ["skill-creative", "Creative Expression", "#e6c16f", "Make something small and imperfect. Repetition matters more than a finished result."],
  ["skill-health", "Healthy Habits", "#a8b997", "Choose one supportive action that is easy to repeat and gentle enough for ordinary days."],
  ["skill-connection", "Meaningful Connections", "#a9bde3", "Create small moments of honest attention with people who matter to you."],
  ["skill-balance", "Emotional Balance", "#99ad8f", "Name what is present, pause before reacting, and keep one compassionate response available."],
].map(([skillId, name, color, growthPlan]) => ({
  id: skillId,
  name,
  color,
  growthPlan,
  targetRecordCount: 5,
  status: "active" as const,
  createdAt: seedTime,
  updatedAt: seedTime,
}));

const DEFAULT_ATTRIBUTES: UserAttribute[] = [
  ["attribute-creativity", "Creativity", "#e6a6b8", 3],
  ["attribute-curiosity", "Curiosity", "#b4a0d2", 4],
  ["attribute-patience", "Patience", "#9fc0b3", 3],
  ["attribute-kindness", "Kindness", "#e8c36f", 3],
  ["attribute-focus", "Focus", "#9db2dc", 3],
].map(([attributeId, name, color, level]) => ({
  id: String(attributeId),
  name: String(name),
  color: String(color),
  level: Number(level),
  evidenceSkillRecordIds: [],
  createdAt: seedTime,
  updatedAt: seedTime,
}));

export function avatarStyleForGender(gender: HeroProfile["gender"]): AvatarStyle {
  return gender === "male" ? "boy" : "girl";
}

function normalizeHero(hero?: Partial<HeroProfile>): HeroProfile {
  const validGenders = ["female", "male", "non-binary", "prefer-not-to-say"];
  const gender = validGenders.includes(String(hero?.gender))
    ? hero?.gender as HeroProfile["gender"]
    : DEFAULT_HERO.gender;
  return {
    name: typeof hero?.name === "string" ? hero.name : DEFAULT_HERO.name,
    gender,
    avatarStyle: avatarStyleForGender(gender),
    motto: typeof hero?.motto === "string" ? hero.motto : DEFAULT_HERO.motto,
    currentTheme: typeof hero?.currentTheme === "string" ? hero.currentTheme : DEFAULT_HERO.currentTheme,
    reflection: typeof hero?.reflection === "string" ? hero.reflection : DEFAULT_HERO.reflection,
    updatedAt: typeof hero?.updatedAt === "string" ? hero.updatedAt : now(),
  };
}

export const GAME_STORAGE_KEY = "life-room-v1";
const GAME_STORAGE_VERSION = 1;

function initialData(): LifeRoomData {
  return {
    hero: { ...DEFAULT_HERO, updatedAt: now() },
    attributes: DEFAULT_ATTRIBUTES.map((item) => ({ ...item })),
    skills: DEFAULT_SKILLS.map((item) => ({ ...item })),
    skillRecords: [],
    diary: [],
    achievements: [],
    guideMessages: [],
    chapters: [],
    atmosphere: { mood: "neutral", sourceEntryId: null, sourceDate: null, revision: 0 },
  };
}

interface LifeRoomActions {
  setHero: (hero: HeroProfile) => void;
  addAttribute: (name: string, color?: string) => void;
  updateAttribute: (attributeId: string, patch: Partial<UserAttribute>) => void;
  removeAttribute: (attributeId: string) => void;
  addSkill: (name: string) => void;
  updateSkill: (skillId: string, patch: Partial<Skill>) => void;
  addSkillRecord: (input: SkillRecordInput) => void;
  updateSkillRecord: (recordId: string, input: SkillRecordInput) => void;
  addDiary: (input: DiaryInput) => void;
  updateDiary: (entryId: string, input: DiaryInput) => void;
  addAchievement: (input: Pick<Achievement, "title" | "excerpt" | "sourceType"> & Partial<Achievement>) => void;
  setAchievementStatus: (achievementId: string, status: AchievementStatus) => void;
  addGuideMessage: (message: Omit<GuideMessage, "id" | "createdAt">) => void;
  saveChapter: (chapter: Omit<LifeNovelChapter, "id" | "updatedAt"> & { id?: string }) => string;
  approveChapter: (chapterId: string) => void;
  removeChapter: (chapterId: string) => void;
  resetDemo: () => void;
}

export type LifeRoomStore = LifeRoomData & LifeRoomActions;

export function snapshotData(state: LifeRoomData): LifeRoomData {
  return {
    hero: normalizeHero(state.hero),
    attributes: state.attributes,
    skills: state.skills,
    skillRecords: state.skillRecords,
    diary: state.diary,
    achievements: state.achievements,
    guideMessages: guideMessagesForToday(state.guideMessages),
    chapters: state.chapters,
    atmosphere: state.atmosphere,
  };
}

function validDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(new Date(date + "T12:00:00Z").getTime());
}

export const useLifeRoomStore = create<LifeRoomStore>()(
  persist<LifeRoomStore, [], [], LifeRoomData>(
    (set, get) => {
      const saveDiary = (input: DiaryInput, entryId = id(), editing = false) => {
        const state = get();
        const change = commitDiary(state, input, entryId, now(), editing);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({
            state: snapshotData({ ...state, ...change }),
            version: GAME_STORAGE_VERSION,
          }));
        }
        set(change);
      };

      const saveSkillRecord = (input: SkillRecordInput, recordId = id(), editing = false) => {
        if (!get().skills.some((skill) => skill.id === input.skillId)) {
          throw new Error("Choose an available skill.");
        }
        if (!validDate(input.date)) throw new Error("Choose a valid date.");
        if (!input.practice.trim()) throw new Error("Describe what you practiced.");
        const timestamp = now();
        set((state) => {
          const previous = state.skillRecords.find((record) => record.id === recordId);
          if (editing && !previous) throw new Error("This skill record is no longer available.");
          const record: SkillRecord = {
            ...input,
            practice: input.practice.trim(),
            durationMinutes: input.durationMinutes === null
              ? null
              : Math.max(0, Math.round(input.durationMinutes)),
            linkedDiaryEntryId: input.linkedDiaryEntryId &&
              state.diary.some((entry) => entry.id === input.linkedDiaryEntryId)
              ? input.linkedDiaryEntryId
              : null,
            id: recordId,
            createdAt: previous?.createdAt ?? timestamp,
            updatedAt: timestamp,
          };
          return {
            skillRecords: previous
              ? state.skillRecords.map((item) => item.id === recordId ? record : item)
              : [record, ...state.skillRecords],
          };
        });
      };

      return {
        ...initialData(),
        setHero: (hero) => set({ hero: normalizeHero({ ...hero, updatedAt: now() }) }),
        addAttribute: (name, color = "#b4a0d2") => set((state) => name.trim() && state.attributes.length < 6 ? ({
          attributes: [...state.attributes, {
            id: id(),
            name: name.trim(),
            color,
            level: 3,
            evidenceSkillRecordIds: [],
            createdAt: now(),
            updatedAt: now(),
          }],
        }) : state),
        updateAttribute: (attributeId, patch) => set((state) => ({
          attributes: state.attributes.map((attribute) => attribute.id === attributeId
            ? {
              ...attribute,
              ...patch,
              name: typeof patch.name === "string" ? patch.name.trim() || attribute.name : attribute.name,
              level: Math.max(1, Math.min(5, Math.round(patch.level ?? attribute.level))),
              updatedAt: now(),
            }
            : attribute),
        })),
        removeAttribute: (attributeId) => set((state) => ({
          attributes: state.attributes.filter((attribute) => attribute.id !== attributeId),
        })),
        addSkill: (name) => set((state) => name.trim() ? ({
          skills: [...state.skills, {
            id: id(),
            name: name.trim(),
            color: "#a8c6aa",
            growthPlan: "Start with one small, repeatable practice and record what actually helps.",
            targetRecordCount: 5,
            status: "active",
            createdAt: now(),
            updatedAt: now(),
          }],
        }) : state),
        updateSkill: (skillId, patch) => set((state) => ({
          skills: state.skills.map((skill) => skill.id === skillId
            ? {
              ...skill,
              ...patch,
              name: typeof patch.name === "string" ? patch.name.trim() || skill.name : skill.name,
              targetRecordCount: Math.max(1, Math.min(20, Math.round(patch.targetRecordCount ?? skill.targetRecordCount))),
              updatedAt: now(),
            }
            : skill),
        })),
        addSkillRecord: (input) => saveSkillRecord(input),
        updateSkillRecord: (recordId, input) => saveSkillRecord(input, recordId, true),
        addDiary: (input) => saveDiary(input),
        updateDiary: (entryId, input) => saveDiary(input, entryId, true),
        addAchievement: (input) => set((state) => ({
          achievements: [{
            id: input.id ?? id(),
            title: input.title.trim(),
            excerpt: input.excerpt.trim(),
            date: input.date ?? todayKey(),
            sourceType: input.sourceType,
            sourceId: input.sourceId ?? null,
            status: input.status ?? "suggested",
            createdAt: input.createdAt ?? now(),
            updatedAt: now(),
          }, ...state.achievements.filter((item) => item.id !== input.id)],
        })),
        setAchievementStatus: (achievementId, status) => set((state) => ({
          achievements: state.achievements.map((item) => item.id === achievementId
            ? { ...item, status, updatedAt: now() }
            : item),
        })),
        addGuideMessage: (message) => set((state) => ({
          guideMessages: [
            ...guideMessagesForToday(state.guideMessages),
            { ...message, id: id(), createdAt: now() },
          ],
        })),
        saveChapter: (chapter) => {
          const chapterId = chapter.id ?? id();
          set((state) => {
            const item: LifeNovelChapter = { ...chapter, id: chapterId, updatedAt: now() };
            return {
              chapters: state.chapters.some((entry) => entry.id === chapterId)
                ? state.chapters.map((entry) => entry.id === chapterId ? item : entry)
                : [item, ...state.chapters],
            };
          });
          return chapterId;
        },
        approveChapter: (chapterId) => set((state) => ({
          chapters: state.chapters.map((chapter) => chapter.id === chapterId
            ? { ...chapter, status: "approved", approvedAt: now(), updatedAt: now() }
            : chapter),
        })),
        removeChapter: (chapterId) => set((state) => ({
          chapters: state.chapters.filter((chapter) => chapter.id !== chapterId),
        })),
        resetDemo: () => set(initialData()),
      };
    },
    {
      name: GAME_STORAGE_KEY,
      version: GAME_STORAGE_VERSION,
      partialize: snapshotData,
      merge: (persisted, current) => {
        const records = persisted as Partial<LifeRoomData> | undefined;
        return {
          ...current,
          ...records,
          hero: normalizeHero(records?.hero),
          attributes: Array.isArray(records?.attributes) ? records.attributes : current.attributes,
          skills: Array.isArray(records?.skills) ? records.skills : current.skills,
          skillRecords: Array.isArray(records?.skillRecords) ? records.skillRecords : current.skillRecords,
          diary: Array.isArray(records?.diary) ? records.diary : current.diary,
          achievements: Array.isArray(records?.achievements) ? records.achievements : current.achievements,
          guideMessages: Array.isArray(records?.guideMessages)
            ? guideMessagesForToday(records.guideMessages)
            : current.guideMessages,
          chapters: Array.isArray(records?.chapters) ? records.chapters : current.chapters,
        };
      },
    },
  ),
);

export function getLifeRoomSnapshot(): LifeRoomData {
  return snapshotData(useLifeRoomStore.getState());
}
