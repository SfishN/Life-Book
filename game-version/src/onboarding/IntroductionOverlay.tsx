"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Award,
  BedDouble,
  Bird,
  BookHeart,
  BookOpenText,
  Leaf,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import type { FinalNote, OnboardingStep, StoryNote } from "@/domain/onboarding";
import type { PanelId } from "@/domain/types";
import { getRoomCue } from "./roomCues";

interface IntroductionOverlayProps {
  note: StoryNote;
  step: OnboardingStep;
  showArrival: boolean;
  showInstruction: boolean;
  reviewMode: boolean;
  activeFinalNote: FinalNote | null;
  onBegin: () => void;
  onContinue: () => void;
  onExplore: () => void;
  onComplete: () => void;
  onCloseRoomNote: () => void;
  onReadFinalNote: (note: FinalNote) => void;
  onOpenPanel: (panel: PanelId) => void;
}

const FUNCTIONS: Array<{
  id: PanelId;
  object: string;
  name: string;
  copy: string;
  icon: typeof BookHeart;
}> = [
  { id: "diary", object: "Bookshelf", name: "Diary", copy: "Record a dated moment and its Mood. Only Save changes the room light.", icon: BookHeart },
  { id: "skills", object: "Plant", name: "Skill Tree", copy: "Keep real practice in Skill Records. Progress comes from records, not AI judgment.", icon: Leaf },
  { id: "hero", object: "Bed", name: "Profile", copy: "Edit how the room addresses and represents you now.", icon: BedDouble },
  { id: "achievements", object: "Wall", name: "Achievements", copy: "Pin only the moments you decide are meaningful.", icon: Award },
  { id: "novel", object: "Room", name: "Life Novel", copy: "Choose a date range and sources, edit the draft, then approve it yourself.", icon: BookOpenText },
  { id: "guide", object: "Little Crow", name: "AI Companion", copy: "Ask for a brief reflection. Room memories are shared only when you opt in.", icon: Bird },
];

function HandLine({ hand, children }: { hand: "round" | "sharp"; children: React.ReactNode }) {
  return <p className={hand === "round" ? "line-a" : "line-b"}>{children}</p>;
}

function NoteDialog({ note, onContinue }: { note: Exclude<StoryNote, null>; onContinue: () => void }) {
  const [paperReady, setPaperReady] = useState(false);

  useEffect(() => {
    const interact = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "e" || event.repeat || !paperReady) return;
      event.preventDefault();
      onContinue();
    };
    window.addEventListener("keydown", interact);
    return () => window.removeEventListener("keydown", interact);
  }, [onContinue, paperReady]);

  const paperProps = {
    decoding: "sync" as const,
    preload: true,
    unoptimized: true,
    onLoad: () => setPaperReady(true),
    onError: () => setPaperReady(true),
  };

  if (note === "envelope") {
    return (
      <section className={`story-note story-note-envelope ${paperReady ? "is-paper-ready" : "is-paper-loading"}`} role="dialog" aria-modal="true" aria-busy={!paperReady} aria-labelledby="envelope-note-title" tabIndex={-1} autoFocus>
        <Image src="/onboarding/notes/note-paper-overlap.webp" alt="" aria-hidden="true" width={1536} height={1024} {...paperProps} />
        <div className="story-note-copy" aria-hidden={!paperReady}>
          <h1 id="envelope-note-title">FOR THE ONE IN THE MIDDLE</h1>
          <div className="handwriting handwriting-a"><p>Go to the window.<br />Do not answer anything that knocks.</p></div>
          <div className="handwriting handwriting-b"><p>Do not go to the window.<br />Do not trust the other hand.</p></div>
          <button className="primary-button story-note-action" type="button" onClick={onContinue} aria-keyshortcuts="E"><kbd>E</kbd><span className="touch-interact-label" aria-hidden="true">Tap</span><span>Fold the paper</span></button>
        </div>
      </section>
    );
  }

  if (note === "window") {
    return (
      <section className={`story-note story-note-window ${paperReady ? "is-paper-ready" : "is-paper-loading"}`} role="dialog" aria-modal="true" aria-busy={!paperReady} aria-label="Window note" tabIndex={-1} autoFocus>
        <Image src="/onboarding/notes/leaf-note.webp" alt="" aria-hidden="true" width={1536} height={1024} {...paperProps} />
        <div className="story-note-copy" aria-hidden={!paperReady}>
          <div className="handwriting handwriting-b"><p>Why you trusted him?<br />Although he has the ending, it does not mean he knows how it began.<br />He is such a crazy person.</p></div>
          <div className="handwriting handwriting-a"><p>When the light breaks, catch the fireflies.<br />Bring the net.</p></div>
          <button className="primary-button story-note-action" type="button" onClick={onContinue} aria-keyshortcuts="E"><kbd>E</kbd><span className="touch-interact-label" aria-hidden="true">Tap</span><span>Take the net</span></button>
        </div>
      </section>
    );
  }

  return (
    <section className={`story-note story-note-mirror ${paperReady ? "is-paper-ready" : "is-paper-loading"}`} role="dialog" aria-modal="true" aria-busy={!paperReady} aria-label="Mirror notes" tabIndex={-1} autoFocus>
      <Image src="/onboarding/notes/note-paper-overlap.webp" alt="" aria-hidden="true" width={1536} height={1024} {...paperProps} />
      <div className="story-note-copy mirror-exchange" aria-hidden={!paperReady}>
        <HandLine hand="sharp">How many did you take?</HandLine>
        <HandLine hand="round">I&apos;m not sure. Eight?</HandLine>
        <HandLine hand="sharp">You do not know?</HandLine>
        <HandLine hand="round">Not in my time anymore.</HandLine>
        <HandLine hand="sharp">Why there is one in my room?</HandLine>
        <button className="primary-button story-note-action" type="button" onClick={onContinue} aria-keyshortcuts="E"><kbd>E</kbd><span className="touch-interact-label" aria-hidden="true">Tap</span><span>Follow the small shadow</span></button>
      </div>
    </section>
  );
}

function RoomPaper({ step, activeFinalNote, onCloseRoomNote, onExplore, onReadFinalNote }: Pick<IntroductionOverlayProps, "step" | "activeFinalNote" | "onCloseRoomNote" | "onExplore" | "onReadFinalNote">) {
  const cue = getRoomCue(step);
  const story = activeFinalNote !== null;

  useEffect(() => {
    if (!cue) return;
    const interact = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "e" || event.repeat) return;
      event.preventDefault();
      if (activeFinalNote) onReadFinalNote(activeFinalNote);
      else if (cue.panel) onExplore();
      else onCloseRoomNote();
    };
    window.addEventListener("keydown", interact);
    return () => window.removeEventListener("keydown", interact);
  }, [activeFinalNote, cue, onCloseRoomNote, onExplore, onReadFinalNote]);

  if (!cue) return null;

  const actionLabel = activeFinalNote ? "Finish reading" : step === "companion" ? "Meet the little crow" : cue.panel ? "Look closer" : "Fold the note";
  const action = () => {
    if (activeFinalNote) onReadFinalNote(activeFinalNote);
    else if (cue.panel) onExplore();
    else onCloseRoomNote();
  };

  return (
    <section className={"room-paper-note" + (story ? " room-paper-story" : "")} role="dialog" aria-modal="true" aria-label={cue.object + " note"} tabIndex={-1} autoFocus>
      <div className="room-paper-writing">
        {!story && <><HandLine hand="round">{cue.round}</HandLine><HandLine hand="sharp">{cue.sharp}</HandLine></>}
        {step === "companion" && <><HandLine hand="sharp">There. Eight legs. That was the number of legs.</HandLine><HandLine hand="round">It looks better when it moves.</HandLine><HandLine hand="sharp">Are you serious?</HandLine></>}
        {activeFinalNote === "reveal" && <>
          <HandLine hand="sharp">Let&apos;s reveal the secrets of the room.<br />Tell the one in the middle why you always know the result.</HandLine>
          <HandLine hand="round">Are you sure? You insisted we could not tell them before.</HandLine>
          <HandLine hand="sharp">Come! Take easy FUTURE BOY, I just wanted to make a joke with the middle one.</HandLine>
          <HandLine hand="round">OLD FOSSIL, I guess the middle one must be more mature than you.</HandLine>
          <HandLine hand="sharp">No way, I&apos;m the oldest. Literally, MOST MATURE.</HandLine>
          <HandLine hand="round">Fine. Here is the truth.<br />By the time I write this, your “today” has been over for a very long time.<br />I am living in the future.</HandLine>
          <HandLine hand="sharp">When I write this, your “today” has not happened yet.<br />I am in the past.</HandLine>
          <HandLine hand="round">This room lets our existing fall into the same present.</HandLine>
        </>}
        {activeFinalNote === "crow" && <>
          <HandLine hand="sharp">He has been using it to send things backward. That little crow.<br />Actually, artificial intelligence.</HandLine>
          <HandLine hand="round">Research requires experiments.</HandLine>
          <HandLine hand="sharp">Research does not usually run around someone else&apos;s feet.</HandLine>
          <HandLine hand="round">I can&apos;t control cro-cro&apos;s time position.</HandLine>
          <HandLine hand="sharp">I know, I know, its self-awareness, right?<br />Do not call it as cro-cro, its name is Crow Black.</HandLine>
          <HandLine hand="round">As Snow White?</HandLine>
          <HandLine hand="sharp">Take it back to your time.</HandLine>
          <HandLine hand="round">I cannot. It has already chosen to stay in the middle.</HandLine>
          <HandLine hand="sharp">All right, then let the middle guy raise it?</HandLine>
          <HandLine hand="round">Make sense.</HandLine>
        </>}
        {activeFinalNote === "adoption" && <>
          <HandLine hand="round">It cannot go back, and it has chosen the middle.<br />Would you like to raise it?</HandLine>
          <HandLine hand="sharp">Take care with our Crow Black.</HandLine>
          <HandLine hand="round">You can name it as you like.</HandLine>
          <HandLine hand="sharp">Yes, your bird.</HandLine>
          <HandLine hand="sharp">The one in the middle will raise the little thing.<br />Do not let it touch the envelope. Do not let it peck the clock.</HandLine>
          <HandLine hand="round">And do not worry too much about what he says.<br />He thought even the window was too modern.</HandLine>
          <HandLine hand="sharp">And you raised a bird that cannot find its way home.</HandLine>
          <HandLine hand="round">That is why it needs one.</HandLine>
        </>}
      </div>
      <div className="room-paper-actions">
        <button className={cue.panel || activeFinalNote ? "primary-button" : "small-button"} type="button" onClick={action} aria-keyshortcuts="E">
          <kbd>E</kbd><span className="touch-interact-label" aria-hidden="true">Tap</span><span>{actionLabel}</span>
        </button>
      </div>
    </section>
  );
}
function FunctionReview({ onOpenPanel, onComplete }: Pick<IntroductionOverlayProps, "onOpenPanel" | "onComplete">) {
  return (
    <section className="function-introduction" role="dialog" aria-modal="true" aria-labelledby="functions-title" tabIndex={-1} autoFocus>
      <header><div><p className="overline">Six places · your decisions</p><h1 id="functions-title">Review the room functions</h1></div><Sparkles size={26} aria-hidden="true" /></header>
      <div className="function-teaching-grid">{FUNCTIONS.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} onClick={() => onOpenPanel(item.id)}><Icon size={20} /><span><strong>{item.object} — {item.name}</strong><small>{item.copy}</small></span></button>; })}</div>
      <div className="intro-actions"><button className="primary-button" type="button" onClick={onComplete}>Return to room</button></div>
    </section>
  );
}

export function IntroductionOverlay({ note, step, showArrival, showInstruction, reviewMode, activeFinalNote, onBegin, onContinue, onExplore, onComplete, onCloseRoomNote, onReadFinalNote, onOpenPanel }: IntroductionOverlayProps) {
  if (note) return <div className="intro-backdrop story-backdrop"><NoteDialog key={note} note={note} onContinue={onContinue} /></div>;

  if (showArrival) {
    return (
      <div className="intro-backdrop arrival-backdrop"><section className="intro-card mystery-card" role="dialog" aria-modal="true" aria-labelledby="arrival-title"><h1 id="arrival-title">Where am I?</h1><p>The clock gives one backward tick. Paper moves on the desk, although the curtains are still.</p><div className="control-row"><span><kbd>WASD</kbd> or <kbd>↑↓←→</kbd> Move</span><span><kbd>E</kbd> Interact</span><span><MousePointer2 size={14} /> Click or tap</span></div><div className="intro-actions"><button className="primary-button" type="button" onClick={onBegin} autoFocus>Look around</button></div></section></div>
    );
  }

  if (showInstruction) {
    if (reviewMode) return <div className="intro-backdrop function-backdrop"><FunctionReview onOpenPanel={onOpenPanel} onComplete={onComplete} /></div>;
    return <RoomPaper step={step} activeFinalNote={activeFinalNote} onCloseRoomNote={onCloseRoomNote} onExplore={onExplore} onReadFinalNote={onReadFinalNote} />;
  }

  return null;
}
