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
    round: "Something happened today. Keep it here?",
    sharp: "Write only what you want to keep.",
  },
  skills: {
    object: "Plant", panel: "skills", glow: [405, 710], paper: [530, 795], crow: [455, 660],
    round: "A little practice can grow.",
    sharp: "Leave a record of what you actually did.",
  },
  profile: {
    object: "Bed", panel: "hero", glow: [790, 520], paper: [655, 730], crow: [835, 525],
    round: "What should this room call you?",
    sharp: "A name can always be changed.",
  },
  achievements: {
    object: "Achievement wall", panel: "achievements", glow: [1000, 550], paper: [975, 355], crow: [1010, 500],
    round: "This frame could hold a moment.",
    sharp: "Only you decide what to pin.",
  },
  novel: {
    object: "Desk", panel: "novel", glow: [1170, 545], paper: [1235, 545], crow: [1130, 485],
    round: "These days might belong together.",
    sharp: "Choose the sources before a chapter is written.",
  },
  companion: {
    object: "Little Crow", panel: null, glow: [430, 645], paper: [520, 700], crow: [430, 625],
    round: "It has been following us.",
    sharp: "It will listen when the room is ready.",
  },
  reveal: {
    object: "A folded page", panel: null, glow: [1100, 605], paper: [950, 735], crow: [1100, 525],
    round: "The two hands have one more thing to say.",
    sharp: "This time, read both sides.",
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
  guide: "complete",
};

export function getPanelAccess(step: OnboardingStep, panel: PanelId): PanelAccess {
  if (getRoomCue(step)?.panel === panel) return "explore";
  return TOUR_ORDER.indexOf(step) >= TOUR_ORDER.indexOf(PANEL_UNLOCKS_AFTER[panel]) ? "open" : "locked";
}
