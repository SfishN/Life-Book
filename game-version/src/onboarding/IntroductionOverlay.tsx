"use client";

import Image from "next/image";
import {
  Award,
  BedDouble,
  BookHeart,
  BookOpenText,
  Bot,
  Eye,
  Leaf,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import type { GuidanceMode, StoryNote } from "@/domain/onboarding";
import type { PanelId } from "@/domain/types";

interface IntroductionOverlayProps {
  note: StoryNote;
  showArrival: boolean;
  showIndex: boolean;
  guidanceMode: GuidanceMode;
  diaryWasSaved: boolean;
  onBegin: () => void;
  onContinue: () => void;
  onSkip: () => void;
  onComplete: () => void;
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
  { id: "diary", object: "Bookshelf", name: "Diary", copy: "Record a dated moment and its weather. Only Save changes the room.", icon: BookHeart },
  { id: "guide", object: "Mirror", name: "AI Guidance", copy: "Reflect through conversation. Saved room context is included only when you opt in.", icon: Bot },
  { id: "skills", object: "Plant", name: "Skill Tree", copy: "Name a capacity and confirm its growth yourself. Diary links are evidence, not scores.", icon: Leaf },
  { id: "hero", object: "Bed", name: "Hero", copy: "Edit how you describe yourself now. Nothing here fixes your identity permanently.", icon: BedDouble },
  { id: "achievements", object: "Wall", name: "Achievements", copy: "Keep milestones that you decide are meaningful.", icon: Award },
  { id: "novel", object: "Room", name: "Life Novel", copy: "Draft from saved material, edit it, and approve only what feels true.", icon: BookOpenText },
];

function WriterMark({ writer }: { writer: "A" | "B" }) {
  return <span className={`writer-mark writer-${writer.toLowerCase()}`} aria-hidden="true">{writer === "A" ? "○" : "△"}</span>;
}

function NoteDialog({ note, onContinue }: { note: Exclude<StoryNote, null>; onContinue: () => void }) {
  if (note === "envelope") {
    return (
      <section className="story-note story-note-envelope" role="dialog" aria-modal="true" aria-labelledby="envelope-note-title" tabIndex={-1} autoFocus>
        <Image src="/onboarding/notes/note-paper-overlap.png" alt="" aria-hidden="true" width={1536} height={1024} unoptimized />
        <div className="story-note-copy">
          <p className="overline">Transcription · two hands</p>
          <h1 id="envelope-note-title">For the one in the middle</h1>
          <div className="handwriting handwriting-a"><WriterMark writer="A" /><p>Go to the window.<br />Bring the net.<br />Do not answer anything that knocks.</p><strong>—A</strong></div>
          <div className="handwriting handwriting-b"><WriterMark writer="B" /><p>Do not go to the window.<br />Do not trust the other hand.<br />If you moved the net, put it back.</p><strong>—B</strong></div>
          <button className="primary-button" type="button" onClick={onContinue}>Fold the paper</button>
        </div>
      </section>
    );
  }

  if (note === "window") {
    return (
      <section className="story-note story-note-window" role="dialog" aria-modal="true" aria-labelledby="window-note-title" tabIndex={-1} autoFocus>
        <Image src="/onboarding/notes/leaf-note.png" alt="" aria-hidden="true" width={1536} height={1024} unoptimized />
        <div className="story-note-copy">
          <p className="overline">A leaf against the inside of the glass</p>
          <h1 id="window-note-title">The mark does not match the room.</h1>
          <div className="handwriting handwriting-b"><WriterMark writer="B" /><p>You trusted him.<br />He has the ending. That does not mean he knows how it began.</p><strong>—B</strong></div>
          <div className="handwriting handwriting-a note-tag"><WriterMark writer="A" /><p>When the light breaks, catch what crosses.<br />Do not count aloud.</p><strong>—A</strong></div>
          <button className="primary-button" type="button" onClick={onContinue}>Take the net</button>
        </div>
      </section>
    );
  }

  return (
    <section className="story-note story-note-mirror" role="dialog" aria-modal="true" aria-labelledby="mirror-note-title" tabIndex={-1} autoFocus>
      <Image src="/onboarding/notes/note-paper-overlap.png" alt="" aria-hidden="true" width={1536} height={1024} unoptimized />
      <div className="story-note-copy mirror-exchange">
        <p className="overline">Marks on the mirror backing</p>
        <h1 id="mirror-note-title">The writing was already underneath.</h1>
        <p className="line-b"><WriterMark writer="B" /> How many did you take?</p>
        <p className="line-a"><WriterMark writer="A" /> I&apos;m not sure. Eight?</p>
        <p className="line-b"><WriterMark writer="B" /> You do not know?</p>
        <p className="line-a"><WriterMark writer="A" /> Not from here.</p>
        <p className="line-b"><WriterMark writer="B" /> Then why is one still in the room?</p>
        <hr />
        <p className="line-a"><WriterMark writer="A" /> The room will ask for a record.</p>
        <p className="line-b"><WriterMark writer="B" /> Write only what happened.</p>
        <p className="line-a"><WriterMark writer="A" /> And what the sky looked like.</p>
        <p className="line-b"><WriterMark writer="B" /> Save it before you believe what changes.</p>
        <button className="primary-button" type="button" onClick={onContinue}>Go to the bookshelf</button>
      </div>
    </section>
  );
}

export function IntroductionOverlay({
  note,
  showArrival,
  showIndex,
  guidanceMode,
  diaryWasSaved,
  onBegin,
  onContinue,
  onSkip,
  onComplete,
  onGuidanceMode,
  onOpenPanel,
}: IntroductionOverlayProps) {
  if (note) {
    return <div className="intro-backdrop story-backdrop"><NoteDialog note={note} onContinue={onContinue} /></div>;
  }

  if (showArrival) {
    return (
      <div className="intro-backdrop arrival-backdrop">
        <section className="intro-card mystery-card" role="dialog" aria-modal="true" aria-labelledby="arrival-title">
          <p className="overline">One room · no visible door</p>
          <h1 id="arrival-title">Where am I?</h1>
          <p>The clock gives one backward tick. Paper moves on the desk, although the curtains are still.</p>
          <div className="control-row">
            <span><kbd>WASD</kbd> or <kbd>↑↓←→</kbd> Move</span>
            <span><kbd>E</kbd> Interact</span>
            <span><MousePointer2 size={14} /> Click or tap</span>
          </div>
          <div className="intro-actions">
            <button className="primary-button" type="button" onClick={onBegin} autoFocus>Look around</button>
            <button className="ghost-button" type="button" onClick={onSkip}>Skip introduction</button>
          </div>
        </section>
      </div>
    );
  }

  if (showIndex) {
    return (
      <div className="intro-backdrop function-backdrop">
        <section className="function-introduction" role="dialog" aria-modal="true" aria-labelledby="functions-title" tabIndex={-1} autoFocus>
          <header>
            <div><p className="overline">Six places · your decisions</p><h1 id="functions-title">The room can hold more than evidence.</h1></div>
            <Sparkles size={26} aria-hidden="true" />
          </header>
          <p className="function-status">{diaryWasSaved ? "The bookshelf now holds your saved record, and its weather is visible in the light." : "You continued without a record. Nothing was saved, and the room keeps its current light."}</p>
          <div className="function-teaching-grid">
            {FUNCTIONS.map((item) => {
              const Icon = item.icon;
              return <button type="button" key={item.id} onClick={() => onOpenPanel(item.id)}><Icon size={20} /><span><strong>{item.object} — {item.name}</strong><small>{item.copy}</small></span></button>;
            })}
          </div>
          <fieldset className="guidance-choice">
            <legend>How closely should the room point the way?</legend>
            {([
              ["quiet", "Quiet", "Show guidance only when requested."],
              ["nudge", "Nudge", "Offer a small environmental hint after hesitation."],
              ["lead", "Lead", "Show a clear route and the next interaction."],
            ] as const).map(([mode, label, copy]) => (
              <button type="button" className={guidanceMode === mode ? "is-selected" : ""} aria-pressed={guidanceMode === mode} key={mode} onClick={() => onGuidanceMode(mode)}>
                <Eye size={17} /><span><strong>{label}</strong><small>{copy}</small></span>
              </button>
            ))}
          </fieldset>
          <div className="final-note" aria-label="Final handwritten exchange">
            <p className="handwriting-a"><WriterMark writer="A" /> If you find the missing page, do not let B read it.</p>
            <p className="handwriting-b"><WriterMark writer="B" /> He knows I can read that.</p>
          </div>
          <div className="intro-actions"><button className="primary-button" type="button" onClick={onComplete}>Enter free exploration</button></div>
        </section>
      </div>
    );
  }

  return null;
}
