export type PanelId = "diary" | "guide" | "skills" | "achievements" | "hero" | "novel";

export type Mood = "calm" | "happy" | "neutral" | "tired" | "stressed";
export type SkillFeeling = "easy" | "steady" | "challenging";

export interface Skill {
  id: string;
  name: string;
  color: string;
  growthPlan: string;
  targetRecordCount: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface SkillRecord {
  id: string;
  skillId: string;
  date: string;
  practice: string;
  durationMinutes: number | null;
  feeling: SkillFeeling;
  linkedDiaryEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SkillRecordInput = Pick<
  SkillRecord,
  "skillId" | "date" | "practice" | "durationMinutes" | "feeling" | "linkedDiaryEntryId"
>;

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: Mood;
  relatedSkillIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type DiaryInput = Pick<DiaryEntry, "date" | "title" | "body" | "mood" | "relatedSkillIds">;

export interface RoomAtmosphere {
  mood: Mood;
  sourceEntryId: string | null;
  sourceDate: string | null;
  revision: number;
}

export type AchievementStatus = "suggested" | "pinned" | "dismissed";

export interface Achievement {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  sourceType: "diary" | "skill-record" | "manual";
  sourceId: string | null;
  status: AchievementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GuideMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  mode?: "openai" | "local";
  includedRoomRecords?: boolean;
}

export interface LifeNovelSourceRef {
  diaryId: string;
  diaryUpdatedAtWhenGenerated: string;
}

export interface LifeNovelChapter {
  id: string;
  chapterNumber: number;
  title: string;
  body: string;
  startDate: string;
  endDate: string;
  sourceRefs: LifeNovelSourceRef[];
  status: "draft" | "approved";
  generationMode: "openai" | "local";
  generatedAt: string;
  approvedAt: string | null;
  updatedAt: string;
}

export type ProfileGender = "female" | "male" | "non-binary" | "prefer-not-to-say";
export type AvatarStyle = "girl" | "boy";

export interface HeroProfile {
  name: string;
  gender: ProfileGender;
  avatarStyle: AvatarStyle;
  motto: string;
  currentTheme: string;
  reflection: string;
  updatedAt: string;
}

export interface UserAttribute {
  id: string;
  name: string;
  color: string;
  level: number;
  evidenceSkillRecordIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LifeRoomData {
  hero: HeroProfile;
  attributes: UserAttribute[];
  skills: Skill[];
  skillRecords: SkillRecord[];
  diary: DiaryEntry[];
  achievements: Achievement[];
  guideMessages: GuideMessage[];
  chapters: LifeNovelChapter[];
  atmosphere: RoomAtmosphere;
}
