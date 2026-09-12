export const ONBOARDING_STORAGE_KEY = "life-as-a-room-game-onboarding-v1";

export type OnboardingStep =
  | "arrival"
  | "envelope"
  | "window"
  | "net"
  | "mirror"
  | "diary"
  | "index"
  | "complete";

export type GuidanceMode = "quiet" | "nudge" | "lead";
export type OnboardingStatus = "not-started" | "in-progress" | "complete";
export type StoryNote = "envelope" | "window" | "mirror" | null;

export interface OnboardingState {
  version: 1;
  status: OnboardingStatus;
  step: OnboardingStep;
  guidanceMode: GuidanceMode;
  completedAt: string | null;
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
  "index",
  "complete",
]);
const MODES = new Set<GuidanceMode>(["quiet", "nudge", "lead"]);

export function createOnboardingState(): OnboardingState {
  return {
    version: 1,
    status: "not-started",
    step: "arrival",
    guidanceMode: "nudge",
    completedAt: null,
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
    const guidanceMode = MODES.has(parsed.guidanceMode as GuidanceMode)
      ? (parsed.guidanceMode as GuidanceMode)
      : fallback.guidanceMode;
    const status: OnboardingStatus = parsed.status === "complete" && step === "complete"
      ? "complete"
      : step === "arrival"
        ? "not-started"
        : "in-progress";
    return {
      version: 1,
      status,
      step: status === "complete" ? "complete" : step,
      guidanceMode,
      completedAt: status === "complete" && typeof parsed.completedAt === "string" ? parsed.completedAt : null,
    };
  } catch {
    return fallback;
  }
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

export function setGuidanceMode(state: OnboardingState, guidanceMode: GuidanceMode): OnboardingState {
  return { ...state, guidanceMode };
}

