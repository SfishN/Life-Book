import type { DiaryEntry, DiaryInput, LifeRoomData } from "./types";
import { normalizeMood } from "./mood";

function validateDate(date: string) {
  const parsedDate = new Date(date + "T12:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error("Choose a valid date for this diary entry.");
  }
}

export function validateDiary(input: DiaryInput): DiaryInput {
  const body = input.body.trim();
  if (!body) throw new Error("Write a moment before saving your diary.");
  validateDate(input.date);
  return {
    date: input.date,
    title: input.title.trim() || body.slice(0, 50),
    body,
    mood: normalizeMood(input.mood),
    relatedSkillIds: Array.from(new Set(input.relatedSkillIds.filter(Boolean))),
  };
}

export function commitDiary(
  state: Pick<LifeRoomData, "diary" | "atmosphere">,
  input: DiaryInput,
  entryId: string,
  timestamp: string,
  editing = false,
): Pick<LifeRoomData, "diary" | "atmosphere"> {
  const valid = validateDiary(input);
  const previous = state.diary.find((entry) => entry.id === entryId);
  if (editing && !previous) throw new Error("This diary entry is no longer available.");
  const entry: DiaryEntry = {
    ...valid,
    id: entryId,
    createdAt: previous?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  return {
    diary: previous
      ? state.diary.map((item) => item.id === entryId ? entry : item)
      : [entry, ...state.diary],
    atmosphere: {
      mood: entry.mood,
      sourceEntryId: entry.id,
      sourceDate: entry.date,
      revision: state.atmosphere.revision + 1,
    },
  };
}
