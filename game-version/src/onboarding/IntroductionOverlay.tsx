"use client";

import Image from "next/image";
import {
  Award,
  BedDouble,
  Bird,
  BookHeart,
  BookOpenText,
  Eye,
  Leaf,
  MousePointer2,
  Sparkles,
  X,
} from "lucide-react";
import type { FinalNote, GuidanceMode, OnboardingStep, StoryNote } from "@/domain/onboarding";
import type { PanelId } from "@/domain/types";
import { getRoomCue } from "./roomCues";

interface IntroductionOverlayProps {
  note: StoryNote;
  step: OnboardingStep;
  showArrival: boolean;
  showInstruction: boolean;
  reviewMode: boolean;
  activeFinalNote: FinalNote | null;
  guidanceMode: GuidanceMode;
  onBegin: () => void;
  onContinue: () => void;
  onAdvance: () => void;
  onExplore: () => void;
  onComplete: () => void;
  onCloseRoomNote: () => void;
  onReadFinalNote: (note: FinalNote) => void;
  onGuidanceMode: (mode: GuidanceMode) => void;
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

function HandMark({ hand }: { hand: "round" | "sharp" }) {
  return <span className={`writer-mark writer-${hand === "round" ? "a" : "b"}`} aria-hidden="true">{hand === "round" ? "○" : "△"}</span>;
}

function HandLine({ hand, children }: { hand: "round" | "sharp"; children: React.ReactNode }) {
  return <p className={hand === "round" ? "line-a" : "line-b"}><HandMark hand={hand} /> {children}</p>;
}

function NoteDialog({ note, onContinue }: { note: Exclude<StoryNote, null>; onContinue: () => void }) {
  if (note === "envelope") {
    return (
      <section className="story-note story-note-envelope" role="dialog" aria-modal="true" aria-labelledby="envelope-note-title" tabIndex={-1} autoFocus>
        <Image src="/onboarding/notes/note-paper-overlap.png" alt="" aria-hidden="true" width={1536} height={1024} unoptimized />
        <div className="story-note-copy">
          <h1 id="envelope-note-title">For the one in the middle</h1>
          <div className="handwriting handwriting-a"><p>Go to the window.<br />Bring the net.<br />Do not answer anything that knocks.</p></div>
          <div className="handwriting handwriting-b"><p>Do not go to the window.<br />Do not trust the other hand.<br />If you already moved the net, put it back.</p></div>
          <button className="primary-button" type="button" onClick={onContinue}>Fold the paper</button>
        </div>
      </section>
    );
  }

  if (note === "window") {
    return (
      <section className="story-note story-note-window" role="dialog" aria-modal="true" aria-label="Window note" tabIndex={-1} autoFocus>
        <Image src="/onboarding/notes/leaf-note.png" alt="" aria-hidden="true" width={1536} height={1024} unoptimized />
        <div className="story-note-copy">
          <div className="handwriting handwriting-b"><p>You trusted him.<br />He has the ending. That does not mean he knows how it began.</p></div>
          <div className="handwriting handwriting-a"><p>When the light breaks, catch what crosses.<br />Do not count aloud.</p></div>
          <button className="primary-button" type="button" onClick={onContinue}>Take the net</button>
        </div>
      </section>
    );
  }

  return (
    <section className="story-note story-note-mirror" role="dialog" aria-modal="true" aria-label="Mirror notes" tabIndex={-1} autoFocus>
      <Image src="/onboarding/notes/note-paper-overlap.png" alt="" aria-hidden="true" width={1536} height={1024} unoptimized />
      <div className="story-note-copy mirror-exchange">
        <HandLine hand="sharp">How many did you take?</HandLine>
        <HandLine hand="round">I&apos;m not sure. Eight?</HandLine>
        <HandLine hand="sharp">You do not know?</HandLine>
        <HandLine hand="round">Not from here.</HandLine>
        <HandLine hand="sharp">Then why is one still in the room?</HandLine>
        <button className="primary-button" type="button" onClick={onContinue}>Follow the small shadow</button>
      </div>
    </section>
  );
}

function RoomPaper({ step, activeFinalNote, onCloseRoomNote, onAdvance, onExplore, onReadFinalNote }: Pick<IntroductionOverlayProps, "step" | "activeFinalNote" | "onCloseRoomNote" | "onAdvance" | "onExplore" | "onReadFinalNote">) {
  const noteStep = activeFinalNote ?? step;
  const cue = getRoomCue(noteStep);
  if (!cue) return null;
  const story = activeFinalNote !== null;

  return (
    <section className={"room-paper-note" + (story ? " room-paper-story" : "")} role="dialog" aria-modal="true" aria-label={cue.object + " note"} tabIndex={-1} autoFocus>
      <button className="room-paper-close" type="button" onClick={onCloseRoomNote} aria-label="Fold the note"><X size={18} /></button>
      <div className="room-paper-writing">
        {!story && <><HandLine hand="round">{cue.round}</HandLine><HandLine hand="sharp">{cue.sharp}</HandLine></>}
        {step === "companion" && <><HandLine hand="sharp">There. Eight legs. That was the number.</HandLine><HandLine hand="round">It looks better when it moves.</HandLine><HandLine hand="sharp">At last, you have supplied a unit.</HandLine></>}
        {activeFinalNote === "reveal" && <>
          <HandLine hand="sharp">Tell the one in the middle why you always know the result.</HandLine>
          <HandLine hand="round">By the time I write this, your “today” has been over for a very long time. I am in your future.</HandLine>
          <HandLine hand="sharp">When I write this, your “today” has not happened yet. I am in your past.</HandLine>
          <HandLine hand="round">This room lets our writing fall into the same present.</HandLine>
          <HandLine hand="sharp">He has been using it to send things backward.</HandLine>
          <HandLine hand="round">Research requires experiments.</HandLine>
          <HandLine hand="sharp">Research does not usually run around someone else&apos;s feet.</HandLine>
        </>}
        {activeFinalNote === "adoption" && <>
          <HandLine hand="sharp">Take it back to your time.</HandLine>
          <HandLine hand="round">I cannot. It has already chosen to stay.</HandLine>
          <HandLine hand="sharp">You raised it.</HandLine>
          <HandLine hand="round">You told the one in the middle to pick up the net.</HandLine>
          <HandLine hand="sharp">Because you sent it here.</HandLine>
          <HandLine hand="round">Then we are jointly responsible.</HandLine>
          <HandLine hand="sharp">The one in the middle will raise the little thing.</HandLine>
          <HandLine hand="round">Their bird.</HandLine>
        </>}
      </div>
      <div className="room-paper-actions">
        {activeFinalNote ? <button className="primary-button" type="button" onClick={() => onReadFinalNote(activeFinalNote)}>Finish reading</button>
          : step === "companion" ? <button className="primary-button" type="button" onClick={onAdvance}>Follow the folded notes</button>
            : cue.panel ? <button className="primary-button" type="button" onClick={onExplore}>Look closer</button>
            : <button className="small-button" type="button" onClick={onCloseRoomNote}>Fold the note</button>}
      </div>
    </section>
  );
}
function FunctionReview({ guidanceMode, onGuidanceMode, onOpenPanel, onComplete }: Pick<IntroductionOverlayProps, "guidanceMode" | "onGuidanceMode" | "onOpenPanel" | "onComplete">) {
  return (
    <section className="function-introduction" role="dialog" aria-modal="true" aria-labelledby="functions-title" tabIndex={-1} autoFocus>
      <header><div><p className="overline">Six places · your decisions</p><h1 id="functions-title">Review the room functions</h1></div><Sparkles size={26} aria-hidden="true" /></header>
      <div className="function-teaching-grid">{FUNCTIONS.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} onClick={() => onOpenPanel(item.id)}><Icon size={20} /><span><strong>{item.object} — {item.name}</strong><small>{item.copy}</small></span></button>; })}</div>
      <fieldset className="guidance-choice"><legend>How closely should the room point the way?</legend>{([ ["quiet", "Quiet", "Show guidance only when requested."], ["nudge", "Nudge", "Offer a small environmental hint after hesitation."], ["lead", "Lead", "Show a clear route and the next interaction."] ] as const).map(([mode, label, copy]) => <button type="button" className={guidanceMode === mode ? "is-selected" : ""} aria-pressed={guidanceMode === mode} key={mode} onClick={() => onGuidanceMode(mode)}><Eye size={17} /><span><strong>{label}</strong><small>{copy}</small></span></button>)}</fieldset>
      <div className="intro-actions"><button className="primary-button" type="button" onClick={onComplete}>Return to room</button></div>
    </section>
  );
}

export function IntroductionOverlay({ note, step, showArrival, showInstruction, reviewMode, activeFinalNote, guidanceMode, onBegin, onContinue, onAdvance, onExplore, onComplete, onCloseRoomNote, onReadFinalNote, onGuidanceMode, onOpenPanel }: IntroductionOverlayProps) {
  if (note) return <div className="intro-backdrop story-backdrop"><NoteDialog note={note} onContinue={onContinue} /></div>;

  if (showArrival) {
    return (
      <div className="intro-backdrop arrival-backdrop"><section className="intro-card mystery-card" role="dialog" aria-modal="true" aria-labelledby="arrival-title"><h1 id="arrival-title">Where am I?</h1><p>The clock gives one backward tick. Paper moves on the desk, although the curtains are still.</p><div className="control-row"><span><kbd>WASD</kbd> or <kbd>↑↓←→</kbd> Move</span><span><kbd>E</kbd> Interact</span><span><MousePointer2 size={14} /> Click or tap</span></div><div className="intro-actions"><button className="primary-button" type="button" onClick={onBegin} autoFocus>Look around</button></div></section></div>
    );
  }

  if (showInstruction) {
    if (reviewMode) return <div className="intro-backdrop function-backdrop"><FunctionReview guidanceMode={guidanceMode} onGuidanceMode={onGuidanceMode} onOpenPanel={onOpenPanel} onComplete={onComplete} /></div>;
    return <RoomPaper step={step} activeFinalNote={activeFinalNote} onCloseRoomNote={onCloseRoomNote} onAdvance={onAdvance} onExplore={onExplore} onReadFinalNote={onReadFinalNote} />;
  }

  return null;
}
