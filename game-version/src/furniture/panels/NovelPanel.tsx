"use client";

import { useMemo, useState } from "react";
import {
  BookOpenText,
  CalendarDays,
  Check,
  ChevronRight,
  FileText,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { LifeNovelChapter } from "@/domain/types";
import { useLifeRoomStore } from "@/store/useLifeRoomStore";
import { useTemporaryDraft } from "../useTemporaryDraft";

function offsetDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

interface NovelRequestResult {
  title: string;
  body: string;
  mode: "openai" | "local";
}

export function NovelPanel() {
  const diary = useLifeRoomStore((state) => state.diary);
  const chapters = useLifeRoomStore((state) => state.chapters);
  const saveChapter = useLifeRoomStore((state) => state.saveChapter);
  const approveChapter = useLifeRoomStore((state) => state.approveChapter);
  const [view, setView] = useState<"new" | "chapter">(chapters[0] ? "chapter" : "new");
  const [selectedChapterId, setSelectedChapterId] = useState(chapters[0]?.id ?? "");
  const [form, setForm, clearForm] = useTemporaryDraft("novel:new", {
    startDate: offsetDate(-6),
    endDate: offsetDate(0),
    selectedDiaryIds: [] as string[],
    title: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? chapters[0];
  const eligible = useMemo(
    () => diary.filter((entry) => entry.date >= form.startDate && entry.date <= form.endDate)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [diary, form.endDate, form.startDate],
  );
  const selectedIds = form.selectedDiaryIds.filter((id) => eligible.some((entry) => entry.id === id));

  function updateRange(field: "startDate" | "endDate", value: string) {
    setForm((current) => ({ ...current, [field]: value, selectedDiaryIds: [] }));
  }

  function toggleSource(id: string) {
    setForm((current) => ({
      ...current,
      selectedDiaryIds: current.selectedDiaryIds.includes(id)
        ? current.selectedDiaryIds.filter((item) => item !== id)
        : [...current.selectedDiaryIds, id],
    }));
  }

  async function requestDraft(sourceEntries: typeof diary, title: string) {
    const response = await fetch("/api/novel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, diary: sourceEntries }),
    });
    if (!response.ok) throw new Error("The chapter could not be generated right now.");
    return response.json() as Promise<NovelRequestResult>;
  }

  async function generate() {
    const sources = eligible.filter((entry) => selectedIds.includes(entry.id));
    if (!sources.length || loading) return;
    setLoading(true);
    setError("");
    try {
      const result = await requestDraft(sources, form.title);
      const timestamp = new Date().toISOString();
      const chapterId = saveChapter({
        chapterNumber: Math.max(0, ...chapters.map((chapter) => chapter.chapterNumber)) + 1,
        title: form.title.trim() || result.title,
        body: result.body,
        startDate: form.startDate,
        endDate: form.endDate,
        sourceRefs: sources.map((entry) => ({ diaryId: entry.id, diaryUpdatedAtWhenGenerated: entry.updatedAt })),
        status: "draft",
        generationMode: result.mode,
        generatedAt: timestamp,
        approvedAt: null,
      });
      setSelectedChapterId(chapterId);
      setView("chapter");
      clearForm({ ...form, selectedDiaryIds: [], title: "" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The chapter could not be generated right now.");
    } finally {
      setLoading(false);
    }
  }

  function openChapter(id: string) {
    setSelectedChapterId(id);
    setView("chapter");
    setError("");
  }

  return (
    <div className="novel-layout-v2">
      <aside className="chapter-sidebar">
        <h2>Chapters</h2>
        <button type="button" className={view === "new" ? "chapter-list-row new is-selected" : "chapter-list-row new"} onClick={() => setView("new")}><Plus size={19} /><span>New chapter</span></button>
        {[...chapters].sort((a, b) => b.chapterNumber - a.chapterNumber).map((chapter) => (
          <button type="button" key={chapter.id} className={view === "chapter" && selectedChapter?.id === chapter.id ? "chapter-list-row is-selected" : "chapter-list-row"} onClick={() => openChapter(chapter.id)}>
            <span className="chapter-number">Ch. {chapter.chapterNumber}</span>
            <span><strong>{chapter.title}</strong><small>{chapter.startDate} – {chapter.endDate}</small></span>
            <em className={"status-pill " + chapter.status}>{chapter.status}</em>
          </button>
        ))}
      </aside>
      {view === "new" ? (
        <section className="chapter-create">
          <h2>Create a new chapter</h2>
          <div className="range-section">
            <h3>Choose diary range</h3>
            <div className="date-range">
              <label><CalendarDays size={16} /><input type="date" value={form.startDate} onChange={(event) => updateRange("startDate", event.target.value)} /></label>
              <span>–</span>
              <label><CalendarDays size={16} /><input type="date" value={form.endDate} onChange={(event) => updateRange("endDate", event.target.value)} /></label>
              <small>{eligible.length} diary {eligible.length === 1 ? "entry" : "entries"} found</small>
            </div>
          </div>
          <div className="diary-source-heading"><h3>Diary sources</h3><div><button type="button" onClick={() => setForm((current) => ({ ...current, selectedDiaryIds: eligible.map((entry) => entry.id) }))}>Select all</button><button type="button" onClick={() => setForm((current) => ({ ...current, selectedDiaryIds: [] }))}>Clear</button></div></div>
          <div className="diary-source-list">
            {eligible.map((entry) => <label key={entry.id}><input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggleSource(entry.id)} /><time>{entry.date.slice(5)}</time><span><strong>{entry.title}</strong><small>{entry.body}</small></span></label>)}
            {!eligible.length && <div className="panel-empty"><FileText size={22} /><p>No Diary entries exist in this range.</p></div>}
          </div>
          <label className="chapter-title-field">Chapter title (optional)<span className="input-with-count"><input value={form.title} maxLength={50} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Let AI create the title for me..." /><small>{form.title.length}/50</small></span></label>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setView(chapters.length ? "chapter" : "new")}>Cancel</button><button className="primary-button" type="button" onClick={generate} disabled={!selectedIds.length || loading}><Sparkles size={16} /> {loading ? "Generating…" : "Generate chapter"}</button></div>
        </section>
      ) : selectedChapter ? (
        <ChapterView
          key={selectedChapter.id + selectedChapter.updatedAt}
          chapter={selectedChapter}
          onApprove={() => approveChapter(selectedChapter.id)}
          onRegenerate={async () => {
            const sources = selectedChapter.sourceRefs.map((ref) => diary.find((entry) => entry.id === ref.diaryId)).filter(Boolean) as typeof diary;
            if (!sources.length || loading) return;
            setLoading(true);
            setError("");
            try {
              const result = await requestDraft(sources, selectedChapter.title);
              saveChapter({ ...selectedChapter, body: result.body, title: result.title || selectedChapter.title, generationMode: result.mode, generatedAt: new Date().toISOString(), status: "draft", approvedAt: null });
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : "The chapter could not be regenerated.");
            } finally {
              setLoading(false);
            }
          }}
          onSave={(title, body) => saveChapter({ ...selectedChapter, title, body })}
          diary={diary}
          loading={loading}
          error={error}
        />
      ) : <div className="panel-empty"><BookOpenText size={24} /><p>Create your first chapter.</p></div>}
    </div>
  );
}

function ChapterView({
  chapter,
  onApprove,
  onRegenerate,
  onSave,
  diary,
  loading,
  error,
}: {
  chapter: LifeNovelChapter;
  onApprove: () => void;
  onRegenerate: () => void;
  onSave: (title: string, body: string) => void;
  diary: ReturnType<typeof useLifeRoomStore.getState>["diary"];
  loading: boolean;
  error: string;
}) {
  const [title, setTitle] = useState(chapter.title);
  const [body, setBody] = useState(chapter.body);
  const [showSources, setShowSources] = useState(false);
  const sources = chapter.sourceRefs.map((ref) => ({
    ref,
    entry: diary.find((entry) => entry.id === ref.diaryId),
  }));

  return (
    <section className="chapter-view">
      <div className="chapter-view-title">
        <div><span>Ch. {chapter.chapterNumber}</span><input value={title} onChange={(event) => setTitle(event.target.value)} disabled={chapter.status === "approved"} /></div>
        <em className={"status-pill " + chapter.status}>{chapter.status}</em>
      </div>
      <textarea className="chapter-body" value={body} onChange={(event) => setBody(event.target.value)} rows={10} readOnly={chapter.status === "approved"} />
      <button type="button" className="source-summary" onClick={() => setShowSources((value) => !value)}>
        <FileText size={21} /><span><strong>{chapter.sourceRefs.length} diary entries · {chapter.startDate} – {chapter.endDate}</strong><small>Generated with {chapter.generationMode === "openai" ? "AI" : "the local fallback"}</small></span><span>View sources <ChevronRight size={17} /></span>
      </button>
      {showSources && <div className="chapter-sources">{sources.map(({ ref, entry }) => <article key={ref.diaryId}><strong>{entry?.title ?? "Source no longer available"}</strong>{entry && <><small>{entry.date}{entry.updatedAt !== ref.diaryUpdatedAtWhenGenerated ? " · edited after generation" : ""}</small><p>{entry.body}</p></>}</article>)}</div>}
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        {chapter.status === "draft" && <button type="button" className="secondary-button" onClick={() => onSave(title.trim() || "Untitled chapter", body)}><Check size={16} /> Save draft</button>}
        <button type="button" className="secondary-button" onClick={onRegenerate} disabled={loading}><RotateCcw size={16} /> {loading ? "Regenerating…" : "Regenerate"}</button>
        {chapter.status === "draft" && <button type="button" className="primary-button" onClick={() => { onSave(title.trim() || "Untitled chapter", body); onApprove(); }} disabled={!body.trim()}><BookOpenText size={16} /> Approve chapter</button>}
      </div>
    </section>
  );
}
