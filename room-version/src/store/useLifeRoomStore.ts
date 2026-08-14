"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey, yesterdayKey } from "@/domain/dates";
import type {
  Achievement,
  CalendarEvent,
  DiaryEntry,
  GuideMessage,
  HeroProfile,
  LifeNovelChapter,
  LifeRoomData,
  MainQuest,
  Skill,
  Todo,
} from "@/domain/types";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const initialData: LifeRoomData = {
  hero: {
    name: "The Dreamer",
    pronouns: "",
    currentTheme: "Learning to notice the life I am already living",
    reflection: "I want this room to hold evidence of patient growth.",
  },
  quests: [
    {
      id: "quest-gentle-rhythm",
      title: "Build a gentler daily rhythm",
      intention: "Create a life that leaves room for attention and rest.",
      progress: 28,
      active: true,
    },
  ],
  skills: [
    {
      id: "skill-reflection",
      name: "Reflection",
      progress: 35,
      evidence: ["Named one small success without minimizing it."],
    },
  ],
  todos: [
    {
      id: "todo-carried-demo",
      title: "Write one honest sentence about yesterday",
      status: "open",
      originalScheduledDate: yesterdayKey(),
      scheduledDate: yesterdayKey(),
      mainQuestId: "quest-gentle-rhythm",
      skillId: "skill-reflection",
      carryoverCount: 1,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "todo-today-demo",
      title: "Take a ten-minute walk without headphones",
      status: "open",
      originalScheduledDate: todayKey(),
      scheduledDate: todayKey(),
      mainQuestId: "quest-gentle-rhythm",
      carryoverCount: 0,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  diary: [],
  events: [
    { id: "event-evening", date: todayKey(), title: "Evening reflection" },
  ],
  annotations: {
    [todayKey()]: "Notice what feels quietly important today.",
  },
  achievements: [],
  guideMessages: [
    {
      id: "guide-welcome",
      role: "assistant",
      content:
        "I am here in the mirror—not to judge the dream, only to notice it with you. What would you like to look at today?",
      createdAt: now(),
      mode: "local",
    },
  ],
  chapters: [],
};

interface LifeRoomActions {
  setHero: (hero: HeroProfile) => void;
  addTodo: (input: Pick<Todo, "title" | "scheduledDate"> & Partial<Todo>) => void;
  updateTodo: (todoId: string, patch: Partial<Todo>) => void;
  completeTodo: (todoId: string, addDiary: boolean) => void;
  addQuest: (input: Pick<MainQuest, "title" | "intention">) => void;
  updateQuest: (questId: string, patch: Partial<MainQuest>) => void;
  addSkill: (name: string) => void;
  updateSkill: (skillId: string, patch: Partial<Skill>) => void;
  addDiary: (input: Pick<DiaryEntry, "date" | "title" | "body"> & Partial<DiaryEntry>) => void;
  updateDiary: (entryId: string, patch: Partial<DiaryEntry>) => void;
  setAnnotation: (date: string, value: string) => void;
  addEvent: (input: Pick<CalendarEvent, "date" | "title">) => void;
  addAchievement: (input: Pick<Achievement, "title" | "description"> & Partial<Achievement>) => void;
  confirmAchievement: (achievementId: string) => void;
  addGuideMessage: (message: Omit<GuideMessage, "id" | "createdAt">) => void;
  saveChapter: (chapter: Omit<LifeNovelChapter, "id" | "updatedAt"> & { id?: string }) => void;
  replaceData: (data: LifeRoomData) => void;
  resetDemo: () => void;
}

export type LifeRoomStore = LifeRoomData & LifeRoomActions;

export const useLifeRoomStore = create<LifeRoomStore>()(
  persist(
    (set) => ({
      ...initialData,
      setHero: (hero) => set({ hero }),
      addTodo: (input) =>
        set((state) => {
          const timestamp = now();
          const task: Todo = {
            id: id(),
            title: input.title,
            status: input.status ?? "open",
            originalScheduledDate: input.originalScheduledDate ?? input.scheduledDate,
            scheduledDate: input.scheduledDate,
            mainQuestId: input.mainQuestId,
            skillId: input.skillId,
            carryoverCount: input.carryoverCount ?? 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          };
          return { todos: [task, ...state.todos] };
        }),
      updateTodo: (todoId, patch) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === todoId ? { ...todo, ...patch, updatedAt: now() } : todo,
          ),
        })),
      completeTodo: (todoId, addToDiary) =>
        set((state) => {
          const task = state.todos.find((todo) => todo.id === todoId);
          if (!task) return state;
          const timestamp = now();
          const todos = state.todos.map((todo) =>
            todo.id === todoId
              ? { ...todo, status: "done" as const, completedAt: timestamp, updatedAt: timestamp }
              : todo,
          );
          const diary = addToDiary
            ? [
                {
                  id: id(),
                  date: todayKey(),
                  title: `A small success: ${task.title}`,
                  body: "I completed this action. I can add what it meant to me when I am ready.",
                  todoId: task.id,
                  skillId: task.skillId,
                  questId: task.mainQuestId,
                  createdAt: timestamp,
                  updatedAt: timestamp,
                },
                ...state.diary,
              ]
            : state.diary;
          const skills = task.skillId
            ? state.skills.map((skill) =>
                skill.id === task.skillId
                  ? {
                      ...skill,
                      progress: Math.min(100, skill.progress + 4),
                      evidence: [`Completed: ${task.title}`, ...skill.evidence],
                    }
                  : skill,
              )
            : state.skills;
          const quests = task.mainQuestId
            ? state.quests.map((quest) =>
                quest.id === task.mainQuestId
                  ? { ...quest, progress: Math.min(100, quest.progress + 5) }
                  : quest,
              )
            : state.quests;
          const alreadyHasFirst = state.achievements.some((item) => item.title === "A Promise Kept");
          const achievements = alreadyHasFirst
            ? state.achievements
            : [
                {
                  id: id(),
                  title: "A Promise Kept",
                  description: "You completed an action and allowed it to become part of your record.",
                  date: todayKey(),
                  confirmed: false,
                },
                ...state.achievements,
              ];
          return { todos, diary, skills, quests, achievements };
        }),
      addQuest: (input) =>
        set((state) => {
          if (state.quests.filter((quest) => quest.active).length >= 3) return state;
          return {
            quests: [
              ...state.quests,
              { id: id(), title: input.title, intention: input.intention, progress: 0, active: true },
            ],
          };
        }),
      updateQuest: (questId, patch) =>
        set((state) => ({
          quests: state.quests.map((quest) => (quest.id === questId ? { ...quest, ...patch } : quest)),
        })),
      addSkill: (name) =>
        set((state) => ({
          skills: [...state.skills, { id: id(), name, progress: 0, evidence: [] }],
        })),
      updateSkill: (skillId, patch) =>
        set((state) => ({
          skills: state.skills.map((skill) => (skill.id === skillId ? { ...skill, ...patch } : skill)),
        })),
      addDiary: (input) =>
        set((state) => {
          const timestamp = now();
          return {
            diary: [
              {
                id: id(),
                date: input.date,
                title: input.title,
                body: input.body,
                todoId: input.todoId,
                skillId: input.skillId,
                questId: input.questId,
                createdAt: timestamp,
                updatedAt: timestamp,
              },
              ...state.diary,
            ],
          };
        }),
      updateDiary: (entryId, patch) =>
        set((state) => ({
          diary: state.diary.map((entry) =>
            entry.id === entryId ? { ...entry, ...patch, updatedAt: now() } : entry,
          ),
        })),
      setAnnotation: (date, value) =>
        set((state) => ({ annotations: { ...state.annotations, [date]: value } })),
      addEvent: (input) =>
        set((state) => ({ events: [...state.events, { id: id(), ...input }] })),
      addAchievement: (input) =>
        set((state) => ({
          achievements: [
            {
              id: id(),
              title: input.title,
              description: input.description,
              date: input.date ?? todayKey(),
              confirmed: input.confirmed ?? false,
            },
            ...state.achievements,
          ],
        })),
      confirmAchievement: (achievementId) =>
        set((state) => ({
          achievements: state.achievements.map((item) =>
            item.id === achievementId ? { ...item, confirmed: true } : item,
          ),
        })),
      addGuideMessage: (message) =>
        set((state) => ({
          guideMessages: [...state.guideMessages, { ...message, id: id(), createdAt: now() }],
        })),
      saveChapter: (chapter) =>
        set((state) => {
          const item: LifeNovelChapter = {
            ...chapter,
            id: chapter.id ?? id(),
            updatedAt: now(),
          };
          const exists = state.chapters.some((entry) => entry.id === item.id);
          return {
            chapters: exists
              ? state.chapters.map((entry) => (entry.id === item.id ? item : entry))
              : [item, ...state.chapters],
          };
        }),
      replaceData: (data) => set(data),
      resetDemo: () => set(initialData),
    }),
    {
      name: "life-as-a-room-v1",
      partialize: (state) => ({
        hero: state.hero,
        todos: state.todos,
        quests: state.quests,
        skills: state.skills,
        diary: state.diary,
        events: state.events,
        annotations: state.annotations,
        achievements: state.achievements,
        guideMessages: state.guideMessages,
        chapters: state.chapters,
      }),
    },
  ),
);

export function getLifeRoomSnapshot(): LifeRoomData {
  const state = useLifeRoomStore.getState();
  return {
    hero: state.hero,
    todos: state.todos,
    quests: state.quests,
    skills: state.skills,
    diary: state.diary,
    events: state.events,
    annotations: state.annotations,
    achievements: state.achievements,
    guideMessages: state.guideMessages,
    chapters: state.chapters,
  };
}
