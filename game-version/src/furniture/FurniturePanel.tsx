"use client";

import {
  type Dispatch,
  FormEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Award,
  BedDouble,
  BookHeart,
  BookOpenText,
  Bot,
  Check,
  Leaf,
  MessageCircleHeart,
  PenLine,
  Sparkles,
  X,
} from "lucide-react";
import { friendlyDate, todayKey } from "@/domain/dates";
import type { DiaryEntry, DiaryInput, HeroProfile, PanelId } from "@/domain/types";
import { getWeatherPreset, WEATHER_OPTIONS } from "@/domain/weather";
import { getLifeRoomSnapshot, useLifeRoomStore } from "@/store/useLifeRoomStore";

interface FurniturePanelProps {
  panel: PanelId;
  onClose: () => void;
  onDiarySaved: () => void;
}

const DRAFT_PREFIX = "life-as-a-room-game-draft:";
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000;

function useTemporaryDraft<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);
  const valueRef = useRef(initialValue);
  const dirtyRef = useRef(false);
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);
  const storageKey = `${DRAFT_PREFIX}${key}`;

  useEffect(() => {
    let restored = initialRef.current;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { value: T; updatedAt: number };
        if (Date.now() - parsed.updatedAt <= DRAFT_MAX_AGE_MS) {
          restored = parsed.value;
          dirtyRef.current = true;
        } else {
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Storage may be unavailable in a restricted browsing context.
      }
    }
    valueRef.current = restored;
    setValue(restored);
    setReady(true);
  }, [storageKey]);

  const writeDraft = useCallback(() => {
    if (!dirtyRef.current) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ value: valueRef.current, updatedAt: Date.now() }),
      );
    } catch {
      // A draft is a convenience; committed room records remain authoritative.
    }
  }, [storageKey]);

  useEffect(() => {
    if (!ready || !dirtyRef.current) return;
    const timeout = window.setTimeout(writeDraft, 600);
    return () => window.clearTimeout(timeout);
  }, [ready, value, writeDraft]);

  useEffect(() => {
    if (!ready) return;
    window.addEventListener("pagehide", writeDraft);
    return () => window.removeEventListener("pagehide", writeDraft);
  }, [ready, writeDraft]);

  useEffect(() => () => writeDraft(), [writeDraft]);

  const updateDraft = useCallback<Dispatch<SetStateAction<T>>>((nextValue) => {
    setValue((current) => {
      const resolved =
        typeof nextValue === "function"
          ? (nextValue as (currentValue: T) => T)(current)
          : nextValue;
      valueRef.current = resolved;
      dirtyRef.current = true;
      return resolved;
    });
  }, []);

  const clearDraft = useCallback(
    (nextValue: T = initialRef.current) => {
      dirtyRef.current = false;
      valueRef.current = nextValue;
      setValue(nextValue);
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Storage may be unavailable in a restricted browsing context.
      }
    },
    [storageKey],
  );

  return [value, updateDraft, clearDraft] as const;
}

const PANEL_META: Record<
  PanelId,
  { title: string; eyebrow: string; icon: typeof BookOpenText; skin: string }
> = {
  novel: { title: "Life Novel", eyebrow: "The room remembers", icon: BookOpenText, skin: "novel" },
  diary: { title: "Diary", eyebrow: "Your words become part of the room", icon: BookHeart, skin: "book" },
  guide: { title: "AI Guidance", eyebrow: "Your companion in the room", icon: Bot, skin: "mirror" },
  skills: { title: "Skill Tree", eyebrow: "The growing plant", icon: Leaf, skin: "plant" },
  hero: { title: "Hero", eyebrow: "The bedside journal", icon: BedDouble, skin: "dream" },
  achievements: {
    title: "Achievement Wall",
    eyebrow: "The memories you chose to keep",
    icon: Award,
    skin: "gallery",
  },
};

export function FurniturePanel({ panel, onClose, onDiarySaved }: FurniturePanelProps) {
  const meta = PANEL_META[panel];
  const Icon = meta.icon;

  return (
    <div className="panel-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`furniture-panel skin-${meta.skin}`} role="dialog" aria-modal="true" aria-labelledby="panel-title">
        <header className="panel-header">
          <div className="panel-title-wrap">
            <span className="panel-icon" aria-hidden="true"><Icon size={20} /></span>
            <div>
              <p className="panel-eyebrow">{meta.eyebrow}</p>
              <h1 id="panel-title">{meta.title}</h1>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close panel">
            <X size={20} />
          </button>
        </header>
        <div className="panel-content">
          {panel === "diary" && <DiaryPanel onSaved={onDiarySaved} />}
          {panel === "skills" && <SkillPanel />}
          {panel === "hero" && <HeroPanel />}
          {panel === "achievements" && <AchievementPanel />}
          {panel === "guide" && <GuidePanel />}
          {panel === "novel" && <NovelPanel />}
        </div>
        <footer className="panel-footer">
          <span><kbd>Esc</kbd> close panel</span>
          <span>Unsubmitted fields are kept as a temporary draft.</span>
        </footer>
      </section>
    </div>
  );
}

function DiaryPanel({ onSaved }: { onSaved: () => void }) {
  const diary = useLifeRoomStore((state) => state.diary);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = diary.find((entry) => entry.id === editingId);
  return (
    <div className="feature-stack diary-layout">
      <DiaryEditor key={editing?.id ?? "new"} entry={editing} onSaved={onSaved} onCancel={() => setEditingId(null)} />
      <section className="record-list diary-shelf" aria-label="Saved diary entries">
        <div className="section-heading"><h2>On your shelf</h2><p className="gentle-note">Saved moments, not a score.</p></div>
        {diary.map((entry) => (
          <article className="record-card diary-card" key={entry.id}>
            <div className="record-card-main">
              <p className="record-meta">{friendlyDate(entry.date)} · {getWeatherPreset(entry.weather).label}</p>
              <h3>{entry.title}</h3>
              <p className="diary-body">{entry.body}</p>
              <button className="small-button" type="button" onClick={() => setEditingId(entry.id)}><PenLine size={15} /> Edit entry</button>
            </div>
          </article>
        ))}
        {diary.length === 0 && <EmptyState icon={BookHeart} text="Keep a moment and its weather. Save your diary to see the light change." />}
      </section>
    </div>
  );
}

function DiaryEditor({ entry, onSaved, onCancel }: {
  entry?: DiaryEntry; onSaved: () => void; onCancel: () => void;
}) {
  const addDiary = useLifeRoomStore((state) => state.addDiary);
  const updateDiary = useLifeRoomStore((state) => state.updateDiary);
  const skills = useLifeRoomStore((state) => state.skills);
  const [draft, setDraft, clearDraft] = useTemporaryDraft<DiaryInput>(`diary:${entry?.id ?? "new"}`, {
    title: entry?.title ?? "", body: entry?.body ?? "", date: entry?.date ?? todayKey(),
    weather: entry?.weather ?? "not-recorded", skillId: entry?.skillId ?? "",
  });
  const [error, setError] = useState("");
  const weather = getWeatherPreset(draft.weather);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (entry) updateDiary(entry.id, draft);
      else addDiary(draft);
      clearDraft({ title: "", body: "", date: todayKey(), weather: "not-recorded", skillId: "" });
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error && (caught.name === "QuotaExceededError" || caught.name === "SecurityError")
        ? "Your browser could not save this entry. Your draft is still here; free some storage or enable local storage and try again."
        : caught instanceof Error ? caught.message : "The diary could not be saved. Your draft is still here.");
    }
  }

  return (
    <form className="object-form book-page diary-editor" onSubmit={submit}>
      <p className="overline">{entry ? "Revisit a page" : "A page worth keeping"}</p>
      <label>Title (optional)<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Name the moment" maxLength={160} /></label>
      <label>What happened?<textarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="An ordinary day, a small success, something difficult… it all belongs here." rows={5} required /></label>
      <div className="form-grid">
        <label>Date<input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} required /></label>
        <label>Related skill (optional)<select value={draft.skillId ?? ""} onChange={(event) => setDraft((current) => ({ ...current, skillId: event.target.value }))}><option value="">None</option>{skills.map((skill) => <option value={skill.id} key={skill.id}>{skill.name}</option>)}</select></label>
      </div>
      <fieldset className="weather-picker">
        <legend>What was the weather that day?</legend>
        <div className="weather-options">
          {WEATHER_OPTIONS.map((option) => (
            <button className={draft.weather === option.value ? "weather-option is-selected" : "weather-option"} type="button" key={option.value} aria-pressed={draft.weather === option.value} onClick={() => setDraft((current) => ({ ...current, weather: option.value }))}>
              <span className={`weather-swatch weather-${option.value}`} aria-hidden="true" />{option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="weather-explanation" aria-live="polite"><strong>When you save:</strong> {weather.description} The bookshelf will mark this moment.</p>
      <p className="gentle-note">Only Save changes the room. Weather is your observation, not a mood assessment. The most recently saved entry sets the light, even when its date is in the past.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="button-row">
        <button className="primary-button" type="submit" disabled={!draft.body.trim()}><BookHeart size={17} /> {entry ? "Save changes & see room" : "Save diary & see room"}</button>
        {entry && <button className="small-button" type="button" onClick={onCancel}>New entry</button>}
      </div>
    </form>
  );
}

function SkillPanel() {
  const skills = useLifeRoomStore((state) => state.skills);
  const addSkill = useLifeRoomStore((state) => state.addSkill);
  const updateSkill = useLifeRoomStore((state) => state.updateSkill);
  const diary = useLifeRoomStore((state) => state.diary);
  const [draft, setDraft, clearDraft] = useTemporaryDraft("skills:new", { name: "" });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    addSkill(draft.name.trim());
    clearDraft({ name: "" });
  }

  return (
    <div className="feature-stack">
      <form className="object-form plant-form" onSubmit={submit}>
        <p className="overline">Plant a capacity</p>
        <div className="inline-form"><label className="grow">Skill<input value={draft.name} onChange={(event) => setDraft({ name: event.target.value })} placeholder="Listening, drawing, patience…" /></label><button className="primary-button" type="submit"><Leaf size={17} /> Plant</button></div>
      </form>
      <div className="skill-garden">
        {skills.map((skill) => (
          <article className="skill-pot" key={skill.id} style={{ "--growth": `${Math.max(12, skill.progress)}%` } as React.CSSProperties}>
            <div className="plant-visual" aria-hidden="true"><span className="stem" /><span className="leaf leaf-a" /><span className="leaf leaf-b" /><span className="leaf leaf-c" /></div>
            <div className="skill-copy"><h3>{skill.name}</h3><p>{skill.evidence.length + diary.filter((entry) => entry.skillId === skill.id).length} linked memories</p><label>Confirmed growth <strong>{skill.progress}%</strong><input type="range" min="0" max="100" value={skill.progress} onChange={(event) => updateSkill(skill.id, { progress: Number(event.target.value) })} /></label>{skill.evidence.slice(0, 2).map((item) => <small key={item}>{item}</small>)}{diary.filter((entry) => entry.skillId === skill.id).map((entry) => <small key={entry.id}>Diary evidence: {entry.title}</small>)}</div>
          </article>
        ))}
      </div>
    </div>
  );
}

function HeroPanel() {
  const hero = useLifeRoomStore((state) => state.hero);
  const setHero = useLifeRoomStore((state) => state.setHero);
  const [draft, setDraft, clearDraft] = useTemporaryDraft("hero:profile", hero);
  const gender = draft.gender === "male" ? "male" : "female";

  function save() {
    const next: HeroProfile = {
      name: draft.name,
      gender,
      currentTheme: draft.currentTheme,
      reflection: draft.reflection,
    };
    setHero(next);
    clearDraft(next);
  }

  return (
    <div className="hero-sheet">
      <div className="hero-portrait" role="img" aria-label={`${gender === "female" ? "Girl" : "Boy"} character, front view`}>
        <div className="hero-portrait-sprite" style={{ backgroundImage: `url(/characters/${gender === "female" ? "girl" : "boy"}.png)` }} />
      </div>
      <div className="hero-fields">
        <p className="overline">Your place in this room</p>
        <label>Name<input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
        <fieldset className="hero-gender-choice"><legend>Hero gender</legend>
          <button type="button" className={gender === "female" ? "is-selected" : ""} aria-pressed={gender === "female"} onClick={() => setDraft((current) => ({ ...current, gender: "female" }))}>Female · girl</button>
          <button type="button" className={gender === "male" ? "is-selected" : ""} aria-pressed={gender === "male"} onClick={() => setDraft((current) => ({ ...current, gender: "male" }))}>Male · boy</button>
        </fieldset>
        <label>Current life theme<textarea value={draft.currentTheme} onChange={(event) => setDraft((current) => ({ ...current, currentTheme: event.target.value }))} rows={2} /></label>
        <label>A note to myself<textarea value={draft.reflection} onChange={(event) => setDraft((current) => ({ ...current, reflection: event.target.value }))} rows={3} /></label>
        <button className="primary-button" type="button" onClick={save}>Save profile</button>
        <p className="gentle-note">Changes remain a temporary draft until you save. No levels, health, or energy.</p>
      </div>
    </div>
  );
}

function AchievementPanel() {
  const achievements = useLifeRoomStore((state) => state.achievements);
  const confirmAchievement = useLifeRoomStore((state) => state.confirmAchievement);
  const addAchievement = useLifeRoomStore((state) => state.addAchievement);
  const [draft, setDraft, clearDraft] = useTemporaryDraft("achievements:new", {
    title: "",
    description: "",
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    addAchievement({ title: draft.title.trim(), description: draft.description.trim(), confirmed: true });
    clearDraft({ title: "", description: "" });
  }

  return (
    <div className="feature-stack">
      <form className="object-form gallery-form" onSubmit={submit}>
        <p className="overline">Frame a meaningful milestone</p>
        <div className="form-grid"><label>Title<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label><label>Why it matters<input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label></div>
        <button className="primary-button" type="submit"><Award size={17} /> Add to the wall</button>
      </form>
      <div className="achievement-wall">
        {achievements.map((item, index) => (
          <article className={`achievement-frame frame-${(index % 3) + 1}`} key={item.id}>
            <Award size={24} aria-hidden="true" /><h3>{item.title}</h3><p>{item.description}</p><small>{friendlyDate(item.date)}</small>
            {!item.confirmed && <button className="small-button" type="button" onClick={() => confirmAchievement(item.id)}><Check size={15} /> Keep this</button>}
          </article>
        ))}
        {achievements.length === 0 && <EmptyState icon={Award} text="The wall will hold milestones you decide are meaningful." />}
      </div>
    </div>
  );
}

function GuidePanel() {
  const messages = useLifeRoomStore((state) => state.guideMessages);
  const addGuideMessage = useLifeRoomStore((state) => state.addGuideMessage);
  const [draft, setDraft, clearDraft] = useTemporaryDraft("guide:message", { message: "" });
  const [sending, setSending] = useState(false);
  const [shareContext, setShareContext] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.message.trim() || sending) return;
    const userText = draft.message.trim();
    addGuideMessage({ role: "user", content: userText });
    clearDraft({ message: "" });
    setSending(true);
    setError("");
    try {
      const snapshot = getLifeRoomSnapshot();
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          context: shareContext ? {
            hero: snapshot.hero,
            recentDiary: snapshot.diary.slice(0, 5),
            skills: snapshot.skills,
            achievements: snapshot.achievements.filter((item) => item.confirmed).slice(0, 5),
            atmosphere: snapshot.atmosphere,
            recentConversation: snapshot.guideMessages.slice(-8),
          } : { recentConversation: snapshot.guideMessages.slice(-8) },
        }),
      });
      if (!response.ok) throw new Error("The mirror is quiet right now.");
      const data = (await response.json()) as { reply: string; mode: "openai" | "local" };
      addGuideMessage({ role: "assistant", content: data.reply, mode: data.mode });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The mirror is quiet right now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mirror-layout">
      <div className="mirror-glass">
        <div className="mirror-orb" aria-hidden="true"><Sparkles size={26} /></div>
        <p>I will notice with you. I will not decide who you are.</p>
      </div>
      <div className="conversation">
        <div className="message-list" aria-live="polite">
          {messages.map((item) => <article className={`message ${item.role}`} key={item.id}><p>{item.content}</p>{item.role === "assistant" && <small>{item.mode === "openai" ? "Mirror AI" : "Local observer"}</small>}</article>)}
          {sending && <article className="message assistant"><p>The mirror is considering your words…</p></article>}
        </div>
        {error && <p className="form-error">{error}</p>}
        <form className="mirror-form" onSubmit={submit}><label className="sr-only" htmlFor="guide-message">Tell the mirror</label><textarea id="guide-message" value={draft.message} onChange={(event) => setDraft({ message: event.target.value })} placeholder="Tell the mirror what you are noticing…" rows={2} /><button className="primary-button" type="submit" disabled={sending}><MessageCircleHeart size={17} /> Speak</button></form>
        <label className="context-consent"><input type="checkbox" checked={shareContext} onChange={(event) => setShareContext(event.target.checked)} /> Include my Hero, recent diary entries, skills, confirmed achievements, and saved room weather in this conversation.</label>
        <p className="gentle-note">Your message and recent conversation are sent when you speak. Saved room records are shared only when checked. The Mirror suggests; you decide what becomes a record.</p>
      </div>
    </div>
  );
}

function NovelPanel() {
  const hero = useLifeRoomStore((state) => state.hero);
  const diary = useLifeRoomStore((state) => state.diary);
  const achievements = useLifeRoomStore((state) => state.achievements);
  const skills = useLifeRoomStore((state) => state.skills);
  const chapters = useLifeRoomStore((state) => state.chapters);
  const saveChapter = useLifeRoomStore((state) => state.saveChapter);
  const [draft, setDraft, clearDraft] = useTemporaryDraft("novel:chapter", {
    body: "",
    title: "Chapter One: The Room Begins to Remember",
  });

  function generateDraft() {
    const recent = diary.slice(0, 3).map((entry) => entry.title).join(", ");
    const skill = skills.find((item) => item.progress > 0)?.name;
    const milestone = achievements.find((item) => item.confirmed)?.title;
    setDraft((current) => ({
      ...current,
      body: `${hero.name} returned to the room with no need to prove anything. ${recent ? `On the bookshelf waited the memory of ${recent}. ` : "The bookshelf was still waiting for its first chosen memory. "}${skill ? `The growing plant held a reminder of ${skill}. ` : ""}${hero.currentTheme ? `A thread through these days was ${hero.currentTheme}. ` : ""}${diary[0] ? `One saved day carried ${getWeatherPreset(diary[0].weather).label.toLowerCase()} weather. ` : ""}${milestone ? `A new frame on the wall was called “${milestone}.” ` : "The achievement wall remained open to a milestone that felt true."} The room did not count the day. It kept it.`,
    }));
  }

  function save(approved: boolean) {
    if (!draft.body.trim()) return;
    saveChapter({ title: draft.title.trim() || "Untitled chapter", period: new Date().toISOString().slice(0, 7), body: draft.body.trim(), approved });
    clearDraft({ ...draft, body: "" });
  }

  return (
    <div className="novel-layout">
      <section className="novel-editor"><p className="overline">Approved records only</p><label>Chapter title<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label><label>Draft<textarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} rows={10} placeholder="Generate a draft from the room, then make it yours." /></label><div className="button-row"><button className="small-button" type="button" onClick={generateDraft}><Sparkles size={16} /> Generate local draft</button><button className="primary-button" type="button" onClick={() => save(true)} disabled={!draft.body.trim()}><BookOpenText size={16} /> Approve chapter</button></div></section>
      <section className="chapter-shelf"><h2>Saved chapters</h2>{chapters.map((chapter) => <article className="chapter-card" key={chapter.id}><p className="overline">{chapter.period} · {chapter.approved ? "Approved" : "Draft"}</p><h3>{chapter.title}</h3><p>{chapter.body}</p></article>)}{chapters.length === 0 && <EmptyState icon={BookOpenText} text="Your first chapter can begin when the room has something you want to keep." />}</section>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof BookOpenText; text: string }) {
  return <div className="empty-state"><Icon size={24} aria-hidden="true" /><p>{text}</p></div>;
}
