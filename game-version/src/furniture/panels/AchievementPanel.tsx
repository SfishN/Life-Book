"use client";

import { type FormEvent, useState } from "react";
import { MoreHorizontal, Pin, Plus, Sparkles } from "lucide-react";
import { useLifeRoomStore } from "@/store/useLifeRoomStore";

export function AchievementPanel() {
  const diary = useLifeRoomStore((state) => state.diary);
  const skillRecords = useLifeRoomStore((state) => state.skillRecords);
  const achievements = useLifeRoomStore((state) => state.achievements);
  const addAchievement = useLifeRoomStore((state) => state.addAchievement);
  const setStatus = useLifeRoomStore((state) => state.setAchievementStatus);
  const pinned = achievements.filter((item) => item.status === "pinned");
  const suggestions = achievements.filter((item) => item.status === "suggested");
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ title: "", excerpt: "" });
  const [error, setError] = useState("");

  async function refreshSuggestions() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "achievement_suggestions",
          diary: diary.slice(0, 20),
          skillRecords: skillRecords.slice(0, 20),
          dismissed: achievements.filter((item) => item.status === "dismissed")
            .map((item) => ({ title: item.title, sourceId: item.sourceId })),
        }),
      });
      if (!response.ok) throw new Error("Suggestions are unavailable right now.");
      const result = await response.json() as {
        suggestions: Array<{
          title: string;
          excerpt: string;
          date: string;
          sourceType: "diary" | "skill-record";
          sourceId: string;
        }>;
      };
      const existing = new Set(achievements.map((item) => item.sourceType + ":" + item.sourceId + ":" + item.title));
      result.suggestions.forEach((item) => {
        const key = item.sourceType + ":" + item.sourceId + ":" + item.title;
        if (!existing.has(key)) addAchievement({ ...item, status: "suggested" });
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Suggestions are unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  function addManual(event: FormEvent) {
    event.preventDefault();
    if (!manual.title.trim()) return;
    addAchievement({
      title: manual.title,
      excerpt: manual.excerpt,
      sourceType: "manual",
      status: "pinned",
    });
    setManual({ title: "", excerpt: "" });
    setShowManual(false);
  }

  return (
    <div className="achievement-layout">
      <section className="achievement-column">
        <div className="section-heading inline"><div><h2>Pinned</h2><p>Keep the moments you want to remember.</p></div><button type="button" className="soft-button" onClick={() => setShowManual((value) => !value)}><Plus size={15} /> Add</button></div>
        {showManual && <form className="manual-achievement" onSubmit={addManual}><input value={manual.title} onChange={(event) => setManual((current) => ({ ...current, title: event.target.value }))} placeholder="Moment title" /><input value={manual.excerpt} onChange={(event) => setManual((current) => ({ ...current, excerpt: event.target.value }))} placeholder="Why it matters" /><button className="primary-button" type="submit">Pin moment</button></form>}
        <div className="achievement-cards">
          {pinned.map((item) => <AchievementCard key={item.id} item={item} actions={<button className="secondary-button" type="button" onClick={() => setStatus(item.id, "suggested")}>Unpin</button>} />)}
          {!pinned.length && <div className="panel-empty"><Pin size={22} /><p>Pinned moments will stay here.</p></div>}
        </div>
      </section>
      <section className="achievement-column ai-column">
        <div className="section-heading inline"><div><h2>AI suggestions</h2><p>Moments that might be worth pinning.</p></div><button type="button" className="soft-button" onClick={refreshSuggestions} disabled={loading}><Sparkles size={15} /> {loading ? "Looking…" : "Find moments"}</button></div>
        {error && <p className="form-error">{error}</p>}
        <div className="achievement-cards">
          {suggestions.map((item) => <AchievementCard key={item.id} item={item} actions={<><button className="primary-button compact" type="button" onClick={() => setStatus(item.id, "pinned")}>Pin</button><button className="secondary-button compact" type="button" onClick={() => setStatus(item.id, "dismissed")}>Dismiss</button></>} />)}
          {!suggestions.length && <div className="panel-empty"><Sparkles size={22} /><p>Save some records, then ask AI to notice possible moments.</p></div>}
        </div>
      </section>
    </div>
  );
}

function AchievementCard({
  item,
  actions,
}: {
  item: ReturnType<typeof useLifeRoomStore.getState>["achievements"][number];
  actions: React.ReactNode;
}) {
  return (
    <article className="achievement-card">
      <button type="button" className="icon-button card-menu" aria-label="More options"><MoreHorizontal size={17} /></button>
      <h3>{item.title}</h3>
      <p className="record-meta">From {item.sourceType === "skill-record" ? "skill record" : item.sourceType} · {item.date}</p>
      <blockquote>“{item.excerpt}”</blockquote>
      <div className="card-actions">{actions}</div>
    </article>
  );
}
