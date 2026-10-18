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
} from "lucide-react";
import type { GuidanceMode, OnboardingStep, StoryNote } from "@/domain/onboarding";
import type { PanelId } from "@/domain/types";

interface IntroductionOverlayProps {
  note: StoryNote;
  step: OnboardingStep;
  showArrival: boolean;
  showInstruction: boolean;
  reviewMode: boolean;
  guidanceMode: GuidanceMode;
  diaryWasSaved: boolean;
  onBegin: () => void;
  onContinue: () => void;
  onSkip: () => void;
  onAdvance: () => void;
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
          <p className="overline">Two hands · no signatures</p>
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
      <section className="story-note story-note-window" role="dialog" aria-modal="true" aria-labelledby="window-note-title" tabIndex={-1} autoFocus>
        <Image src="/onboarding/notes/leaf-note.png" alt="" aria-hidden="true" width={1536} height={1024} unoptimized />
        <div className="story-note-copy">
          <p className="overline">A leaf against the inside of the glass</p>
          <h1 id="window-note-title">The mark does not match the room.</h1>
          <div className="handwriting handwriting-b"><p>You trusted him.<br />He has the ending. That does not mean he knows how it began.</p></div>
          <div className="handwriting handwriting-a note-tag"><p>When the light breaks, catch what crosses.<br />Do not count aloud.</p></div>
          <button className="primary-button" type="button" onClick={onContinue}>Take the net</button>
        </div>
      </section>
    );
  }

  return (
    <section className="story-note story-note-mirror" role="dialog" aria-modal="true" aria-labelledby="mirror-note-title" tabIndex={-1} autoFocus>
      <Image src="/onboarding/notes/note-paper-overlap.png" alt="" aria-hidden="true" width={1536} height={1024} unoptimized />
      <div className="story-note-copy mirror-exchange">
        <p className="overline">Two old notes behind the mirror</p>
        <h1 id="mirror-note-title">Something scratches behind the glass.</h1>
        <HandLine hand="sharp">How many did you take?</HandLine>
        <HandLine hand="round">I&apos;m not sure. Eight?</HandLine>
        <HandLine hand="sharp">You do not know?</HandLine>
        <HandLine hand="round">Not from here.</HandLine>
        <HandLine hand="sharp">Then why is one still in the room?</HandLine>
        <p className="mystery-count-note">Eight has no unit.</p>
        <button className="primary-button" type="button" onClick={onContinue}>Follow the small shadow</button>
      </div>
    </section>
  );
}

interface FunctionInstructionProps {
  icon: typeof BookHeart;
  overline: string;
  title: string;
  panel: PanelId;
  panelLabel: string;
  onOpenPanel: (panel: PanelId) => void;
  onAdvance: () => void;
  children: React.ReactNode;
}

function FunctionInstruction({ icon: Icon, overline, title, panel, panelLabel, onOpenPanel, onAdvance, children }: FunctionInstructionProps) {
  return (
    <section className="function-introduction guided-instruction" role="dialog" aria-modal="true" aria-labelledby="instruction-title" tabIndex={-1} autoFocus>
      <header><div><p className="overline">{overline}</p><h1 id="instruction-title">{title}</h1></div><Icon size={29} aria-hidden="true" /></header>
      <div className="guided-instruction-body">{children}</div>
      <div className="intro-actions">
        <button className="primary-button" type="button" onClick={() => onOpenPanel(panel)}>Open {panelLabel}</button>
        <button className="small-button" type="button" onClick={onAdvance}>Continue without opening</button>
      </div>
    </section>
  );
}

function InstructionStage({ step, diaryWasSaved, onOpenPanel, onAdvance, onComplete }: Pick<IntroductionOverlayProps, "step" | "diaryWasSaved" | "onOpenPanel" | "onAdvance" | "onComplete">) {
  if (step === "diary") {
    return (
      <FunctionInstruction icon={BookHeart} overline="Bookshelf · Diary and Mood" title="The little crow carries a blank page to the shelf." panel="diary" panelLabel="Diary" onOpenPanel={onOpenPanel} onAdvance={onAdvance}>
        <div className="instruction-dialogue"><HandLine hand="round">Write down one thing that happened today. The room needs to know what belongs to now.</HandLine><HandLine hand="sharp">Leave only what you are willing to keep. You choose the light as well.</HandLine></div>
        <ol className="instruction-list"><li>Choose a date and a Mood, then write one moment.</li><li>You may add a title and link a Skill, or use a neutral practice sentence.</li><li>Only an explicit Save creates the Diary entry and changes the room light.</li><li>A saved Diary adds a visible book to the shelf; closing without Save keeps the room unchanged.</li></ol>
      </FunctionInstruction>
    );
  }

  if (step === "skills") {
    return (
      <FunctionInstruction icon={Leaf} overline="Plant · Skill Tree and Skill Record" title="The changed light reaches the leaves." panel="skills" panelLabel="Skill Tree" onOpenPanel={onOpenPanel} onAdvance={onAdvance}>
        <p className="function-status">{diaryWasSaved ? "The bookshelf now holds the saved moment. The little crow lands on the plant beside it." : "Nothing personal was saved. The little crow still lands on the plant to show the next place."}</p>
        <div className="instruction-dialogue"><HandLine hand="round">Do it a few more times and it becomes a habit later.</HandLine><HandLine hand="sharp">Do not pass off the ending as the process. Leave a practice record first.</HandLine></div>
        <ul className="instruction-list"><li>A Skill is something you choose to cultivate.</li><li>A Skill Record is one real practice, with date, activity, duration, and feeling or difficulty.</li><li>A Diary may be linked as evidence.</li><li>Plant progress comes from saved records; <strong>Why this progress?</strong> shows its sources.</li></ul>
      </FunctionInstruction>
    );
  }

  if (step === "profile") {
    return (
      <FunctionInstruction icon={BedDouble} overline="Bed · Profile" title="The crow drags out a blank label." panel="hero" panelLabel="Profile" onOpenPanel={onOpenPanel} onAdvance={onAdvance}>
        <div className="instruction-dialogue"><HandLine hand="round">At least tell the room what to call you now.</HandLine><HandLine hand="sharp">Write the name lightly. The room keeps things longer than people do.</HandLine></div>
        <ul className="instruction-list"><li>Name, Gender, Motto, and Attributes remain editable.</li><li>The room character follows Gender automatically; there is no separate appearance choice.</li><li>Attributes are directions to observe, not permanent scores.</li></ul>
      </FunctionInstruction>
    );
  }

  if (step === "achievements") {
    return (
      <FunctionInstruction icon={Award} overline="Wall · Achievements" title="A record is dragged toward an empty frame." panel="achievements" panelLabel="Achievement Wall" onOpenPanel={onOpenPanel} onAdvance={onAdvance}>
        <div className="instruction-dialogue"><HandLine hand="round">This wall will be full later.</HandLine><HandLine hand="sharp">If the one in the middle chooses to pin anything to it.</HandLine></div>
        <ul className="instruction-list"><li>Create an Achievement yourself or inspect an AI suggestion.</li><li>Pin, Unpin, and Dismiss are always your decisions.</li><li>The wall never decides automatically what deserves to be remembered.</li></ul>
      </FunctionInstruction>
    );
  }

  if (step === "novel") {
    return (
      <FunctionInstruction icon={BookOpenText} overline="Room · Life Novel" title="Several records appear in the wrong order." panel="novel" panelLabel="Life Novel" onOpenPanel={onOpenPanel} onAdvance={onAdvance}>
        <div className="instruction-dialogue"><HandLine hand="round">Put them together. I remember this chapter being rather good.</HandLine><HandLine hand="sharp">You remember it. That does not mean the one in the middle has to write it that way.</HandLine></div>
        <ol className="instruction-list"><li>Select a Diary date range and inspect the entries inside it.</li><li>Choose the records allowed as sources.</li><li>Generate an editable Draft and view its sources.</li><li>Edit or regenerate it, then explicitly Approve the chapter.</li></ol>
      </FunctionInstruction>
    );
  }

  if (step === "companion") {
    return (
      <section className="function-introduction guided-instruction crow-instruction" role="dialog" aria-modal="true" aria-labelledby="crow-instruction-title" tabIndex={-1} autoFocus>
        <header><div><p className="overline">Little Crow · AI Companion</p><h1 id="crow-instruction-title">The small thing finally steps into full view.</h1></div><Bird size={29} aria-hidden="true" /></header>
        <div className="crow-reveal-scene"><div className="instruction-crow-portrait" role="img" aria-label="The little crow unfolds eight thin legs" /><div className="instruction-dialogue"><HandLine hand="sharp">There. Eight legs. That was the number.</HandLine><HandLine hand="round">It looks better when it moves.</HandLine><HandLine hand="sharp">At last, you have supplied a unit.</HandLine></div></div>
        <div className="instruction-dialogue companion-handwritten-guide"><HandLine hand="round">You can ask it one question. It is good at remembering what it is allowed to know.</HandLine><HandLine hand="sharp">Let it read only the records you choose. Its conversation clears after midnight.</HandLine></div>
        <div className="intro-actions"><button className="primary-button" type="button" onClick={() => onOpenPanel("guide")}>Speak to the little crow</button><button className="small-button" type="button" onClick={onAdvance}>Stay silent</button></div>
      </section>
    );
  }

  if (step === "reveal") {
    return (
      <section className="function-introduction guided-instruction timeline-instruction" role="dialog" aria-modal="true" aria-labelledby="reveal-title" tabIndex={-1} autoFocus>
        <header><div><p className="overline">The envelope · one final argument</p><h1 id="reveal-title">Why does one hand always know the result?</h1></div><Sparkles size={29} aria-hidden="true" /></header>
        <div className="instruction-dialogue long-exchange">
          <HandLine hand="sharp">That is enough. Tell the one in the middle why you always know the result.</HandLine>
          <HandLine hand="round">Are you sure? You insisted we could not tell them before.</HandLine>
          <HandLine hand="sharp">I insisted that you could not be the one to tell them.</HandLine>
          <HandLine hand="round">Old fossil, those are the same sentence.</HandLine>
          <HandLine hand="sharp">Perhaps they are, to people from your century.</HandLine>
          <hr />
          <HandLine hand="round">Fine. By the time I write this, your “today” has been over for a very long time. I am in your future.</HandLine>
          <HandLine hand="sharp">When I write this, your “today” has not happened yet. I am in your past.</HandLine>
          <HandLine hand="round">This room lets our writing fall into the same present.</HandLine>
          <HandLine hand="sharp">He has been using it to send things backward.</HandLine>
          <HandLine hand="round">Research requires experiments.</HandLine>
          <HandLine hand="sharp">Research does not usually run around someone else&apos;s feet.</HandLine>
          <HandLine hand="round">It simply failed to return as planned.</HandLine>
          <HandLine hand="sharp">Because “return” was never part of your plan.</HandLine>
        </div>
        <div className="intro-actions"><button className="primary-button" type="button" onClick={onAdvance}>Look at the little crow</button></div>
      </section>
    );
  }

  if (step === "adoption") {
    return (
      <section className="function-introduction guided-instruction adoption-instruction" role="dialog" aria-modal="true" aria-labelledby="adoption-title" tabIndex={-1} autoFocus>
        <header><div><p className="overline">The middle time · a decision</p><h1 id="adoption-title">The little crow sits at your feet.</h1></div><Bird size={29} aria-hidden="true" /></header>
        <div className="instruction-dialogue long-exchange">
          <HandLine hand="sharp">Take it back to your time.</HandLine>
          <HandLine hand="round">I cannot. It has already chosen to stay.</HandLine>
          <HandLine hand="sharp">You raised it.</HandLine>
          <HandLine hand="round">You told the one in the middle to pick up the net.</HandLine>
          <HandLine hand="sharp">Because you sent it here.</HandLine>
          <HandLine hand="round">Then we are jointly responsible.</HandLine>
          <HandLine hand="sharp">No.</HandLine>
          <hr />
          <HandLine hand="round">It cannot go back, and it has chosen the middle. Let the one in the middle raise it.</HandLine>
          <HandLine hand="sharp">You cannot leave an experiment with a stranger.</HandLine>
          <HandLine hand="round">It is not an experiment anymore.</HandLine>
          <HandLine hand="sharp">Then what is it?</HandLine>
          <HandLine hand="round">Their bird.</HandLine>
          <HandLine hand="sharp">…Agreed. The one in the middle will raise the little thing. Do not let it touch the envelope. Do not let it peck the clock.</HandLine>
          <HandLine hand="round">And do not worry too much about what he says. He thought even the window was too modern.</HandLine>
          <HandLine hand="sharp">And you raised a bird that cannot find its way home.</HandLine>
          <HandLine hand="round">That is why it needs one.</HandLine>
        </div>
        <div className="adoption-crow-bubble" aria-label="The little crow's first bubble">…</div>
        <div className="intro-actions"><button className="primary-button" type="button" onClick={onComplete}>Let it stay · Unlock Room Index</button></div>
      </section>
    );
  }

  return null;
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

export function IntroductionOverlay({ note, step, showArrival, showInstruction, reviewMode, guidanceMode, diaryWasSaved, onBegin, onContinue, onSkip, onAdvance, onComplete, onGuidanceMode, onOpenPanel }: IntroductionOverlayProps) {
  if (note) return <div className="intro-backdrop story-backdrop"><NoteDialog note={note} onContinue={onContinue} /></div>;

  if (showArrival) {
    return (
      <div className="intro-backdrop arrival-backdrop"><section className="intro-card mystery-card" role="dialog" aria-modal="true" aria-labelledby="arrival-title"><p className="overline">One room · no visible door</p><h1 id="arrival-title">Where am I?</h1><p>The clock gives one backward tick. Paper moves on the desk, although the curtains are still.</p><div className="control-row"><span><kbd>WASD</kbd> or <kbd>↑↓←→</kbd> Move</span><span><kbd>E</kbd> Interact</span><span><MousePointer2 size={14} /> Click or tap</span></div><div className="intro-actions"><button className="primary-button" type="button" onClick={onBegin} autoFocus>Look around</button><button className="ghost-button" type="button" onClick={onSkip}>Skip introduction</button></div></section></div>
    );
  }

  if (showInstruction) {
    return <div className="intro-backdrop function-backdrop">{reviewMode ? <FunctionReview guidanceMode={guidanceMode} onGuidanceMode={onGuidanceMode} onOpenPanel={onOpenPanel} onComplete={onComplete} /> : <InstructionStage step={step} diaryWasSaved={diaryWasSaved} onOpenPanel={onOpenPanel} onAdvance={onAdvance} onComplete={onComplete} />}</div>;
  }

  return null;
}
