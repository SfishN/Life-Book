import type { OnboardingStep } from "@/domain/onboarding";
import type { PanelId } from "@/domain/types";

interface RoomCue {
  object: string;
  panel: PanelId | null;
  glow: readonly [number, number];
  paper: readonly [number, number];
  crow: readonly [number, number];
  round: string;
  sharp: string;
}

export const ROOM_CUES = {
  diary: {
    object: "Bookshelf", panel: "diary", glow: [320, 455], paper: [320, 525], crow: [340, 300],
    round: "Write down one thing that happened today. The room needs to know what belongs to which time.",
    sharp: "Leave only what you are willing to keep. You choose the light as well.",
  },
  skills: {
    object: "Plant", panel: "skills", glow: [405, 710], paper: [530, 795], crow: [455, 660],
    round: "Do it a few more times and it becomes a habit later.",
    sharp: "Do not pass off the ending as the process. Leave a practice record first.",
  },
  profile: {
    object: "Bed", panel: "hero", glow: [790, 520], paper: [800, 595], crow: [835, 525],
    round: "At least tell the room what to call you.",
    sharp: "Write the name. The room keeps things longer than people do.",
  },
  achievements: {
    object: "Achievement wall", panel: "achievements", glow: [1000, 550], paper: [975, 355], crow: [1010, 500],
    round: "This wall will be full later.",
    sharp: "If the person living now chooses to pin anything to it.",
  },
  novel: {
    object: "Desk", panel: "novel", glow: [1170, 545], paper: [1235, 545], crow: [1130, 485],
    round: "Put them together. The chapter will be super good.",
    sharp: "You should know that the one in the middle doesn't have to write it.",
  },
  companion: {
    object: "Little Crow", panel: "guide", glow: [430, 645], paper: [520, 700], crow: [430, 625],
    round: "You can ask it one question. It is good at remembering what it is allowed to know.",
    sharp: "I have to admit, it's really cute... But I don't agree with eight legs! Never ever.",
  },
  reveal: {
    object: "Three folded pages", panel: null, glow: [765, 775], paper: [590, 790], crow: [765, 685],
    round: "The two hands have one more thing to say.",
    sharp: "There is more on each page.",
  },
  adoption: {
    object: "Little Crow", panel: null, glow: [755, 735], paper: [755, 805], crow: [755, 700],
    round: "It has chosen to stay.",
    sharp: "The choice is yours now.",
  },
} as const satisfies Record<string, RoomCue>;

export type RoomCueStep = keyof typeof ROOM_CUES;

export function getRoomCue(step: OnboardingStep): RoomCue | null {
  return Object.prototype.hasOwnProperty.call(ROOM_CUES, step)
    ? ROOM_CUES[step as RoomCueStep]
    : null;
}

export type PanelAccess = "locked" | "explore" | "open";

const TOUR_ORDER: OnboardingStep[] = [
  "diary", "skills", "profile", "achievements", "novel", "companion", "reveal", "adoption", "complete",
];

const PANEL_UNLOCKS_AFTER: Record<PanelId, OnboardingStep> = {
  diary: "skills",
  skills: "profile",
  hero: "achievements",
  achievements: "novel",
  novel: "companion",
  guide: "reveal",
};

export function getPanelAccess(step: OnboardingStep, panel: PanelId): PanelAccess {
  if (getRoomCue(step)?.panel === panel) return "explore";
  return TOUR_ORDER.indexOf(step) >= TOUR_ORDER.indexOf(PANEL_UNLOCKS_AFTER[panel]) ? "open" : "locked";
}
