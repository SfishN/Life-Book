"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BedDouble,
  BookHeart,
  BookOpenText,
  Bot,
  DoorOpen,
  Footprints,
  HelpCircle,
  Leaf,
  Menu,
  RotateCcw,
  X,
} from "lucide-react";
import {
  createOnboardingState,
  type GuidanceMode,
  moveOnboardingTo,
  type OnboardingState,
  readOnboardingState,
  setGuidanceMode,
  type StoryNote,
  writeOnboardingState,
} from "@/domain/onboarding";
import type { PanelId } from "@/domain/types";
import { getWeatherPreset } from "@/domain/weather";
import { friendlyDate } from "@/domain/dates";
import { FurniturePanel } from "@/furniture/FurniturePanel";
import { IntroductionOverlay } from "@/onboarding/IntroductionOverlay";
import { RoomGame } from "@/room/RoomGame";
import { useLifeRoomStore } from "@/store/useLifeRoomStore";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

interface Proximity {
  panel: PanelId;
  label: string;
}

interface OnboardingProximity {
  action: "envelope" | "window" | "sweep" | "mirror";
  label: string;
}

type OnboardingSceneAction = OnboardingProximity["action"] | "net-complete";

const ROOM_INDEX: Array<{ id: PanelId; label: string; object: string; icon: typeof BookHeart }> = [
  { id: "diary", label: "Diary", object: "Bookshelf", icon: BookHeart },
  { id: "guide", label: "AI Guidance", object: "Mirror", icon: Bot },
  { id: "skills", label: "Skill Tree", object: "Plant", icon: Leaf },
  { id: "hero", label: "Hero", object: "Bed", icon: BedDouble },
  { id: "achievements", label: "Achievements", object: "Achievement wall", icon: Award },
  { id: "novel", label: "Life Novel", object: "Room", icon: BookOpenText },
];

const OBJECTIVES: Partial<Record<OnboardingState["step"], string>> = {
  envelope: "The envelope on the desk is glowing.",
  window: "A pale mark has appeared on the window.",
  net: "Catch three crossings. Missed shapes always return.",
  mirror: "Something moved behind the standing mirror.",
};

export function LifeRoomApp() {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [proximity, setProximity] = useState<Proximity | null>(null);
  const [onboardingProximity, setOnboardingProximity] = useState<OnboardingProximity | null>(null);
  const [showRoomIndex, setShowRoomIndex] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [safeToClose, setSafeToClose] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [netFeedback, setNetFeedback] = useState("");
  const [sceneNote, setSceneNote] = useState<StoryNote>(null);
  const [reviewFunctions, setReviewFunctions] = useState(false);
  const [diaryWasSaved, setDiaryWasSaved] = useState(false);
  const [nudgeCueReady, setNudgeCueReady] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [onboarding, setOnboarding] = useState<OnboardingState>(createOnboardingState);

  const diaryCount = useLifeRoomStore((state) => state.diary.length);
  const confirmedAchievements = useLifeRoomStore(
    (state) => state.achievements.filter((item) => item.confirmed).length,
  );
  const chapterCount = useLifeRoomStore((state) => state.chapters.length);
  const resetDemo = useLifeRoomStore((state) => state.resetDemo);
  const atmosphere = useLifeRoomStore((state) => state.atmosphere);
  const weather = getWeatherPreset(atmosphere.weather);
  const memoryLevel = diaryCount + confirmedAchievements * 2 + chapterCount * 3;
  const introductionActive = onboarding.status !== "complete";
  const showArrival = onboardingReady && introductionActive && onboarding.step === "arrival";
  const showFunctionIntroduction = onboardingReady && (onboarding.step === "index" || reviewFunctions);
  const objective = introductionActive ? OBJECTIVES[onboarding.step] : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const restored = readOnboardingState(window.localStorage);
      setOnboarding(restored);
      if (restored.step === "diary" && restored.status !== "complete") setActivePanel("diary");
      setOnboardingReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<Proximity>).detail;
      setActivePanel(detail.panel);
      setShowRoomIndex(false);
    };
    const nearby = (event: Event) => setProximity((event as CustomEvent<Proximity | null>).detail);
    const nearbyOnboarding = (event: Event) => setOnboardingProximity((event as CustomEvent<OnboardingProximity | null>).detail);
    const onboardingAction = (event: Event) => {
      const action = (event as CustomEvent<{ action: OnboardingSceneAction }>).detail.action;
      if (action === "envelope") setSceneNote("envelope");
      if (action === "window") setSceneNote("window");
      if (action === "mirror") setSceneNote("mirror");
      if (action === "sweep") setNetFeedback("");
      if (action === "net-complete") {
        setNetFeedback("");
        setOnboarding((current) => {
          const next = moveOnboardingTo(current, "mirror");
          try {
            writeOnboardingState(window.localStorage, next);
          } catch {
            // The scene can still continue for this visit when storage is unavailable.
          }
          return next;
        });
      }
    };
    const onboardingFeedback = (event: Event) => setNetFeedback((event as CustomEvent<{ message: string }>).detail.message);
    window.addEventListener("life-room:open", open);
    window.addEventListener("life-room:proximity", nearby);
    window.addEventListener("life-room:onboarding-proximity", nearbyOnboarding);
    window.addEventListener("life-room:onboarding-action", onboardingAction);
    window.addEventListener("life-room:onboarding-feedback", onboardingFeedback);
    return () => {
      window.removeEventListener("life-room:open", open);
      window.removeEventListener("life-room:proximity", nearby);
      window.removeEventListener("life-room:onboarding-proximity", nearbyOnboarding);
      window.removeEventListener("life-room:onboarding-action", onboardingAction);
      window.removeEventListener("life-room:onboarding-feedback", onboardingFeedback);
    };
  }, []);

  useEffect(() => {
    if (!onboardingReady || onboarding.status !== "complete" || onboarding.guidanceMode !== "nudge" || activePanel || showHelp || showExit || showRoomIndex || reviewFunctions) return;
    const timer = window.setTimeout(() => setNudgeCueReady(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [activePanel, onboarding.guidanceMode, onboarding.status, onboardingReady, reviewFunctions, showExit, showHelp, showRoomIndex]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (sceneNote) {
        setSceneNote(null);
        return;
      }
      if (activePanel) {
        closePanel();
        return;
      }
      if (showHelp) {
        setShowHelp(false);
        return;
      }
      if (reviewFunctions) {
        setReviewFunctions(false);
        return;
      }
      setShowExit(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function persistOnboarding(next: OnboardingState) {
    setOnboarding(next);
    try {
      writeOnboardingState(window.localStorage, next);
    } catch {
      setSaveNotice("The introduction will work for this visit, but this browser could not remember its progress.");
    }
  }

  function moveTo(step: OnboardingState["step"]) {
    persistOnboarding(moveOnboardingTo(onboarding, step));
  }

  function chooseGuidance(mode: GuidanceMode) {
    setNudgeCueReady(false);
    persistOnboarding(setGuidanceMode(onboarding, mode));
  }

  function beginIntroduction() {
    setSceneNote(null);
    setDiaryWasSaved(false);
    setNetFeedback("");
    moveTo("envelope");
  }

  function replayIntroduction() {
    const fresh = { ...createOnboardingState(), guidanceMode: onboarding.guidanceMode };
    persistOnboarding(fresh);
    setSceneNote(null);
    setActivePanel(null);
    setReviewFunctions(false);
    setShowHelp(false);
    setDiaryWasSaved(false);
    setNetFeedback("");
    setNudgeCueReady(false);
    setSaveNotice("");
  }

  function skipIntroduction() {
    setSceneNote(null);
    setActivePanel(null);
    setShowHelp(false);
    moveTo("index");
  }

  function continueStoryNote() {
    if (sceneNote === "envelope") moveTo("window");
    if (sceneNote === "window") moveTo("net");
    if (sceneNote === "mirror") {
      moveTo("diary");
      setActivePanel("diary");
    }
    setSceneNote(null);
  }

  function finishIntroduction() {
    if (reviewFunctions && onboarding.status === "complete") {
      setReviewFunctions(false);
      return;
    }
    setNudgeCueReady(false);
    persistOnboarding(moveOnboardingTo(onboarding, "complete"));
    setReviewFunctions(false);
    setSaveNotice("The room is open. The small shape remains near the mirror, watching where you choose to go.");
  }

  function openPanel(panel: PanelId) {
    setActivePanel(panel);
    setShowRoomIndex(false);
    setNudgeCueReady(false);
  }

  function closePanel() {
    setActivePanel(null);
    if (onboarding.step === "diary" && introductionActive) moveTo("index");
  }

  function diarySaved() {
    const savedAtmosphere = useLifeRoomStore.getState().atmosphere;
    const preset = getWeatherPreset(savedAtmosphere.weather);
    setActivePanel(null);
    setSaveNotice(`Diary saved. ${preset.description} Your bookshelf remembers this moment.`);
    if (onboarding.step === "diary" && introductionActive) {
      setDiaryWasSaved(true);
      moveTo("index");
    }
  }

  function resetGame() {
    if (!window.confirm("Reset only this game version's local records? This cannot be undone. Introduction progress is kept, and room-version records are not affected.")) return;
    resetDemo();
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith("life-as-a-room-game-draft:"))
      .forEach((key) => window.localStorage.removeItem(key));
    setSaveNotice("");
    setShowHelp(false);
  }

  function sendOnboardingCommand() {
    if (!onboardingProximity) return;
    window.dispatchEvent(new CustomEvent("life-room:onboarding-command", { detail: { action: onboardingProximity.action } }));
  }

  function attemptExit() {
    setSafeToClose(true);
    window.setTimeout(() => window.close(), 250);
  }

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date()),
    [],
  );
  const storyModalOpen = !onboardingReady || showArrival || Boolean(sceneNote) || showFunctionIntroduction;
  const showGuidanceCue = onboardingReady
    && onboarding.status === "complete"
    && !activePanel
    && !showHelp
    && !showExit
    && !showRoomIndex
    && !reviewFunctions
    && (onboarding.guidanceMode === "lead" || (onboarding.guidanceMode === "nudge" && nudgeCueReady));

  return (
    <main className="life-room-app" data-weather={atmosphere.weather} data-room-revision={atmosphere.revision} data-onboarding-step={onboarding.step}>
      <ServiceWorkerRegistration />
      <RoomGame
        paused={Boolean(activePanel || showHelp || showExit || showRoomIndex || storyModalOpen)}
        memoryLevel={memoryLevel}
        diaryCount={diaryCount}
        atmosphere={atmosphere}
        onboardingStep={onboardingReady ? onboarding.step : "arrival"}
        guidanceMode={onboarding.guidanceMode}
      />
      <div className="room-vignette" aria-hidden="true" />

      <header className="room-header">
        <div><p className="room-kicker">Life as a Room · Game</p><p className="room-date">{dateLabel}</p></div>
        <div className="header-actions">
          <span className="room-status">{diaryCount} diary entries · {memoryLevel} memories</span>
          <button className="glass-button" type="button" onClick={() => openPanel("diary")}><BookHeart size={17} /> Diary</button>
          <button className="glass-button" type="button" onClick={() => setShowHelp(true)}><HelpCircle size={17} /> Help</button>
          <button className="glass-button" type="button" onClick={() => setShowRoomIndex((value) => !value)} aria-expanded={showRoomIndex}><Menu size={17} /> Room index</button>
        </div>
      </header>

      {objective && !storyModalOpen && !activePanel && !showHelp && <div className="story-objective" role="status"><span aria-hidden="true">✦</span>{objective}</div>}

      {showRoomIndex && (
        <nav className="room-index" aria-label="Furniture index">
          <header><div><p className="overline">Accessible room index</p><h2>Visit an object</h2></div><button className="icon-button" type="button" onClick={() => setShowRoomIndex(false)} aria-label="Close room index"><X size={18} /></button></header>
          <div className="room-index-grid">
            {ROOM_INDEX.map((item) => {
              const Icon = item.icon;
              return <button type="button" key={item.id} onClick={() => openPanel(item.id)}><Icon size={18} /><span><strong>{item.object}</strong><small>{item.label}</small></span></button>;
            })}
          </div>
          <div className="room-index-guidance"><strong>Room guidance: {onboarding.guidanceMode}</strong><button className="small-button" type="button" onClick={() => setShowHelp(true)}>Change</button></div>
        </nav>
      )}

      <aside className="atmosphere-caption" aria-label="Room lighting"><span className={`weather-swatch weather-${atmosphere.weather}`} aria-hidden="true" /><div><strong>{weather.label === "Not recorded" ? "Gentle room light" : `${weather.label} light`}</strong><small>{atmosphere.sourceDate ? `From your diary · ${friendlyDate(atmosphere.sourceDate)}` : "Save a diary to bring the day's weather inside"}</small></div></aside>

      {saveNotice && <div className="room-save-notice" role="status"><BookHeart size={20} aria-hidden="true" /><p>{saveNotice}</p><button className="icon-button" type="button" onClick={() => setSaveNotice("")} aria-label="Dismiss message"><X size={17} /></button></div>}

      {showGuidanceCue && !introductionActive && <button className="pet-guidance-cue" type="button" onClick={() => openPanel("diary")}><Footprints size={19} aria-hidden="true" /><span><strong>{onboarding.guidanceMode === "lead" ? "A clear trail reaches the bookshelf." : "Small marks have appeared near the bookshelf."}</strong><small>Open Diary, or choose another place from the Room Index.</small></span></button>}

      <div className="interaction-area" aria-live="polite">
        {netFeedback && onboarding.step === "net" && <p className="net-feedback">{netFeedback}</p>}
        {onboardingProximity && introductionActive ? <button type="button" className="interaction-prompt" onClick={sendOnboardingCommand}><kbd>E</kbd><span>{onboardingProximity.label}</span></button> : proximity && !introductionActive ? <button type="button" className="interaction-prompt" onClick={() => openPanel(proximity.panel)}><kbd>E</kbd><span>Open {proximity.label}</span></button> : <div className="interaction-hint"><span><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> move</span><span><kbd>E</kbd> interact</span></div>}
      </div>

      {activePanel && <FurniturePanel panel={activePanel} onClose={closePanel} onDiarySaved={diarySaved} />}

      <IntroductionOverlay note={sceneNote} showArrival={showArrival} showIndex={showFunctionIntroduction} guidanceMode={onboarding.guidanceMode} diaryWasSaved={diaryWasSaved} onBegin={beginIntroduction} onContinue={continueStoryNote} onSkip={skipIntroduction} onComplete={finishIntroduction} onGuidanceMode={chooseGuidance} onOpenPanel={openPanel} />

      {showHelp && (
        <div className="intro-backdrop"><section className="intro-card help-card" role="dialog" aria-modal="true" aria-labelledby="help-title"><p className="overline">Room controls and privacy</p><h1 id="help-title">Move at your own pace.</h1><p>Use WASD or Arrow Keys to move, E to interact, and Esc to close. Click or tap an object for direct access. Records stay in this browser; the Mirror shares saved context only when you explicitly opt in.</p><fieldset className="compact-guidance-choice"><legend>Guidance</legend>{(["quiet", "nudge", "lead"] as GuidanceMode[]).map((mode) => <button type="button" key={mode} className={onboarding.guidanceMode === mode ? "is-selected" : ""} aria-pressed={onboarding.guidanceMode === mode} onClick={() => chooseGuidance(mode)}>{mode}</button>)}</fieldset><div className="intro-actions"><button className="primary-button" type="button" onClick={() => setShowHelp(false)} autoFocus>Return to room</button>{introductionActive ? <button className="small-button" type="button" onClick={skipIntroduction}>Skip to room functions</button> : <button className="small-button" type="button" onClick={() => { setShowHelp(false); setReviewFunctions(true); }}>Review room functions</button>}<button className="small-button" type="button" onClick={replayIntroduction}><RotateCcw size={16} /> Replay introduction</button><button className="ghost-button" type="button" onClick={resetGame}>Reset game records</button></div></section></div>
      )}

      {showExit && <div className="intro-backdrop"><section className="exit-card" role="alertdialog" aria-modal="true" aria-labelledby="exit-title"><DoorOpen size={28} aria-hidden="true" /><h1 id="exit-title">Leave the room for now?</h1>{safeToClose ? <p>Your records are saved locally. It is safe to close this tab or app window.</p> : <p>Your local records and introduction progress are already saved. The room will be here when you return.</p>}<div className="button-row">{!safeToClose && <button className="primary-button" type="button" onClick={attemptExit}>Exit app</button>}<button className="small-button" type="button" onClick={() => { setShowExit(false); setSafeToClose(false); }}>{safeToClose ? "Return to room" : "Stay"}</button></div></section></div>}
    </main>
  );
}
