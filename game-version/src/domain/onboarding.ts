export const ONBOARDING_STORAGE_KEY = "life-room-onboarding-v1";

export type OnboardingStep =
  | "arrival"
  | "envelope"
  | "window"
  | "net"
  | "mirror"
  | "diary"
  | "skills"
  | "profile"
  | "achievements"
  | "novel"
  | "companion"
  | "reveal"
  | "adoption"
  | "complete";

export type OnboardingStatus = "not-started" | "in-progress" | "complete";
export type StoryNote = "envelope" | "window" | "mirror" | null;
export const FINAL_NOTE_ORDER = ["reveal", "crow", "adoption"] as const;
export type FinalNote = (typeof FINAL_NOTE_ORDER)[number];
export type FinalNotesRead = Record<FinalNote, boolean>;

export interface OnboardingState {
  version: 1;
  status: OnboardingStatus;
  step: OnboardingStep;
  completedAt: string | null;
  finalNotesRead: FinalNotesRead;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STEPS = new Set<OnboardingStep>([
  "arrival",
  "envelope",
  "window",
  "net",
  "mirror",
  "diary",
  "skills",
  "profile",
  "achievements",
  "novel",
  "companion",
  "reveal",
  "adoption",
  "complete",
]);
export function createOnboardingState(): OnboardingState {
  return {
    version: 1,
    status: "not-started",
    step: "arrival",
    completedAt: null,
    finalNotesRead: { reveal: false, crow: false, adoption: false },
  };
}

export function readOnboardingState(storage: StorageLike): OnboardingState {
  const fallback = createOnboardingState();
  try {
    const raw = storage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    if (parsed.version !== 1) return fallback;
    const step = STEPS.has(parsed.step as OnboardingStep) ? (parsed.step as OnboardingStep) : fallback.step;
    const status: OnboardingStatus = parsed.status === "complete" && step === "complete"
      ? "complete"
      : step === "arrival"
        ? "not-started"
        : "in-progress";
    return {
      version: 1,
      status,
      step: status === "complete" ? "complete" : step,
      completedAt: status === "complete" && typeof parsed.completedAt === "string" ? parsed.completedAt : null,
      finalNotesRead: {
        reveal: parsed.finalNotesRead?.reveal === true,
        crow: parsed.finalNotesRead?.crow === true,
        adoption: parsed.finalNotesRead?.adoption === true,
      },
    };
  } catch {
    return fallback;
  }
}

export function markFinalNoteRead(state: OnboardingState, note: FinalNote): OnboardingState {
  return { ...state, finalNotesRead: { ...state.finalNotesRead, [note]: true } };
}

export function writeOnboardingState(storage: StorageLike, state: OnboardingState) {
  storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
}

export function moveOnboardingTo(state: OnboardingState, step: OnboardingStep): OnboardingState {
  return {
    ...state,
    status: step === "arrival" ? "not-started" : step === "complete" ? "complete" : "in-progress",
    step,
    completedAt: step === "complete" ? new Date().toISOString() : null,
  };
}
