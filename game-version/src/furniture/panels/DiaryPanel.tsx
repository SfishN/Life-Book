"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  BookHeart,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Leaf,
} from "lucide-react";
import { todayKey } from "@/domain/dates";
import { getMoodPreset, MOOD_OPTIONS } from "@/domain/mood";
import type { DiaryEntry, DiaryInput, SkillFeeling, SkillRecordInput } from "@/domain/types";
import { useLifeRoomStore } from "@/store/useLifeRoomStore";
import { useTemporaryDraft } from "../useTemporaryDraft";

type DiaryTab = "write" | "skill";

function moveDate(dateKey: string, offset: number) {
  const date = new Date(dateKey + "T12:00:00");
  date.setDate(date.getDate() + offset);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function dateLabel(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "short",
  }).format(new Date(dateKey + "T12:00:00"));
}

export function DiaryPanel({ onSaved, guided = false }: { onSaved: () => void; guided?: boolean }) {
  const [tab, setTab] = useState<DiaryTab>("write");
  const [editingId, setEditingId] = useState<string | null>(null);
  const diary = useLifeRoomStore((state) => state.diary);
  const editing = diary.find((entry) => entry.id === editingId);

  return (
    <div className="diary-panel">
      <div className="segmented-tabs" role="tablist" aria-label="Diary mode">
        <button type="button" role="tab" aria-selected={tab === "write"} className={tab === "write" ? "is-active" : ""} onClick={() => setTab("write")}>Write diary</button>
        <button type="button" role="tab" aria-selected={tab === "skill"} className={tab === "skill" ? "is-active" : ""} onClick={() => setTab("skill")}>Skill record</button>
      </div>
      {tab === "write" ? (
        <DiaryEditor
          key={editing?.id ?? "new"}
          entry={editing}
          onSaved={onSaved}
          guided={guided}
          onNew={() => setEditingId(null)}
          onEdit={setEditingId}
        />
      ) : (
        <SkillRecordEditor />
      )}
    </div>
  );
}

function DiaryEditor({
  entry,
  onSaved,
  guided,
  onNew,
  onEdit,
}: {
  entry?: DiaryEntry;
  onSaved: () => void;
  guided: boolean;
  onNew: () => void;
  onEdit: (id: string) => void;
}) {
  const diary = useLifeRoomStore((state) => state.diary);
  const skills = useLifeRoomStore((state) => state.skills);
  const addDiary = useLifeRoomStore((state) => state.addDiary);
  const updateDiary = useLifeRoomStore((state) => state.updateDiary);
  const empty: DiaryInput = {
    title: "",
    body: "",
    date: todayKey(),
    mood: "neutral",
    relatedSkillIds: [],
  };
  const [draft, setDraft, clearDraft] = useTemporaryDraft<DiaryInput>(
    "diary:" + (entry?.id ?? "new"),
    entry ? {
      title: entry.title,
      body: entry.body,
      date: entry.date,
      mood: entry.mood,
      relatedSkillIds: entry.relatedSkillIds,
    } : empty,
  );
  const [error, setError] = useState("");
  const mood = getMoodPreset(draft.mood);
  const recent = useMemo(
    () => [...diary].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6),
    [diary],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (entry) updateDiary(entry.id, draft);
      else addDiary(draft);
      clearDraft(empty);
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The Diary could not be saved.");
    }
  }

  function toggleSkill(skillId: string) {
    setDraft((current) => ({
      ...current,
      relatedSkillIds: current.relatedSkillIds.includes(skillId)
        ? current.relatedSkillIds.filter((id) => id !== skillId)
        : [...current.relatedSkillIds, skillId],
    }));
  }

  return (
    <div className="two-column diary-columns">
      <form className="ui-form diary-write-form" onSubmit={submit}>
        <div className="date-nav">
          <span><CalendarDays size={17} /> {dateLabel(draft.date)}</span>
          <div>
            <button type="button" className="icon-button" aria-label="Previous day" onClick={() => setDraft((current) => ({ ...current, date: moveDate(current.date, -1) }))}><ChevronLeft size={18} /></button>
            <button type="button" className="icon-button" aria-label="Next day" onClick={() => setDraft((current) => ({ ...current, date: moveDate(current.date, 1) }))}><ChevronRight size={18} /></button>
          </div>
        </div>
        <fieldset className="mood-picker">
          <legend>How do you feel today?</legend>
          <div className="mood-options">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={draft.mood === option.value ? "mood-option is-selected" : "mood-option"}
                aria-pressed={draft.mood === option.value}
                onClick={() => setDraft((current) => ({ ...current, mood: option.value }))}
              >
                <span aria-hidden="true">{option.face}</span>{option.label}
              </button>
            ))}
          </div>
        </fieldset>
        {guided && <div className="diary-handwritten-cue" aria-label="Notes from two writers"><p className="line-a">Write down one thing that happened today. The room needs to know what belongs to which time.</p><p className="line-b">Leave only what you are willing to keep. You choose the light as well.</p></div>}
        <label>Diary title
          <span className="input-with-count">
            <input value={draft.title} maxLength={50} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="A short title for today..." />
            <small>{draft.title.length}/50</small>
          </span>
        </label>
        <label>Write about your day
          <textarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="What happened today?" rows={6} required />
        </label>
        <details className="related-skills">
          <summary><Leaf size={15} /> Link skills (optional)</summary>
          <div>{skills.map((skill) => <label key={skill.id}><input type="checkbox" checked={draft.relatedSkillIds.includes(skill.id)} onChange={() => toggleSkill(skill.id)} />{skill.name}</label>)}</div>
        </details>
        <p className="field-help"><span className={"mood-swatch mood-" + draft.mood} /> Saving will apply {mood.label.toLowerCase()} light to the room.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          {entry && <button className="secondary-button" type="button" onClick={onNew}>New entry</button>}
          <button className="primary-button" type="submit" disabled={!draft.body.trim()}><BookHeart size={17} /> Save</button>
        </div>
      </form>
      <section className="side-list" aria-label="Recent records">
        <h2>Recent records</h2>
        {recent.map((item) => (
          <button className="list-row" type="button" key={item.id} onClick={() => onEdit(item.id)}>
            <time>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(item.date + "T12:00:00"))}</time>
            <span><strong>{item.title}</strong><small>{item.body}</small></span>
            <ChevronRight size={17} />
          </button>
        ))}
        {recent.length === 0 && <div className="panel-empty"><BookHeart size={22} /><p>Your saved days will appear here.</p></div>}
      </section>
    </div>
  );
}

function SkillRecordEditor() {
  const allSkills = useLifeRoomStore((state) => state.skills);
  const skills = useMemo(() => allSkills.filter((skill) => skill.status === "active"), [allSkills]);
  const records = useLifeRoomStore((state) => state.skillRecords);
  const diary = useLifeRoomStore((state) => state.diary);
  const addSkillRecord = useLifeRoomStore((state) => state.addSkillRecord);
  const empty: SkillRecordInput = {
    skillId: skills[0]?.id ?? "",
    date: todayKey(),
    practice: "",
    durationMinutes: 5,
    feeling: "steady",
    linkedDiaryEntryId: null,
  };
  const [draft, setDraft, clearDraft] = useTemporaryDraft<SkillRecordInput>("skill-record:new", empty);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const sameDayDiary = diary.find((entry) => entry.date === draft.date);
  const recent = [...records].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaved("");
    try {
      addSkillRecord({
        ...draft,
        linkedDiaryEntryId: draft.linkedDiaryEntryId && sameDayDiary ? sameDayDiary.id : null,
      });
      setSaved("Skill record saved.");
      clearDraft({ ...empty, skillId: draft.skillId, date: draft.date });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The Skill Record could not be saved.");
    }
  }

  function chooseFeeling(feeling: SkillFeeling) {
    setDraft((current) => ({ ...current, feeling }));
  }

  return (
    <div className="two-column diary-columns">
      <form className="ui-form skill-record-form" onSubmit={submit}>
        <div className="date-nav">
          <span><CalendarDays size={17} /> {dateLabel(draft.date)}</span>
          <div>
            <button type="button" className="icon-button" aria-label="Previous day" onClick={() => setDraft((current) => ({ ...current, date: moveDate(current.date, -1), linkedDiaryEntryId: null }))}><ChevronLeft size={18} /></button>
            <button type="button" className="icon-button" aria-label="Next day" onClick={() => setDraft((current) => ({ ...current, date: moveDate(current.date, 1), linkedDiaryEntryId: null }))}><ChevronRight size={18} /></button>
          </div>
        </div>
        <label>Choose a skill
          <select value={draft.skillId} onChange={(event) => setDraft((current) => ({ ...current, skillId: event.target.value }))}>
            {skills.map((skill) => <option value={skill.id} key={skill.id}>{skill.name}</option>)}
          </select>
        </label>
        <label>What did you practice?
          <textarea value={draft.practice} onChange={(event) => setDraft((current) => ({ ...current, practice: event.target.value }))} placeholder="Five minutes of quiet breathing before work." rows={5} required />
        </label>
        <div className="form-grid skill-record-meta">
          <label><span><Clock3 size={15} /> Duration</span>
            <select value={draft.durationMinutes ?? ""} onChange={(event) => setDraft((current) => ({ ...current, durationMinutes: event.target.value ? Number(event.target.value) : null }))}>
              <option value="">Not recorded</option><option value="5">5 min</option><option value="10">10 min</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">60 min</option>
            </select>
          </label>
          <fieldset className="feeling-picker">
            <legend>How did it feel?</legend>
            <div>{(["easy", "steady", "challenging"] as SkillFeeling[]).map((feeling) => <button type="button" key={feeling} className={draft.feeling === feeling ? "is-selected" : ""} onClick={() => chooseFeeling(feeling)}>{feeling}</button>)}</div>
          </fieldset>
        </div>
        <label className={sameDayDiary ? "check-row" : "check-row is-disabled"}>
          <input
            type="checkbox"
            disabled={!sameDayDiary}
            checked={Boolean(draft.linkedDiaryEntryId && sameDayDiary)}
            onChange={(event) => setDraft((current) => ({ ...current, linkedDiaryEntryId: event.target.checked && sameDayDiary ? sameDayDiary.id : null }))}
          />
          {sameDayDiary ? "Link to today’s diary: " + sameDayDiary.title : "No Diary entry exists for this date"}
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {saved && <p className="form-success" role="status">{saved}</p>}
        <div className="form-actions"><button className="primary-button" type="submit" disabled={!draft.skillId || !draft.practice.trim()}><Leaf size={17} /> Save record</button></div>
      </form>
      <section className="side-list">
        <h2>Recent skill records</h2>
        {recent.map((record) => {
          const skill = skills.find((item) => item.id === record.skillId);
          return <article className="list-row static" key={record.id}><time>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(record.date + "T12:00:00"))}</time><span><strong>{skill?.name ?? "Archived skill"}</strong><small>{record.practice}</small></span><ChevronRight size={17} /></article>;
        })}
        {recent.length === 0 && <div className="panel-empty"><Leaf size={22} /><p>Practice records will become your Skill Diary.</p></div>}
      </section>
    </div>
  );
}
