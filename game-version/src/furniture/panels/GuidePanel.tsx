"use client";

import { type FormEvent, type KeyboardEvent, useMemo, useState } from "react";
import { Info, Send, X } from "lucide-react";
import { getLifeRoomSnapshot, guideMessagesForToday, useLifeRoomStore } from "@/store/useLifeRoomStore";
import { useTemporaryDraft } from "../useTemporaryDraft";

interface GuidePanelProps {
  onClose: () => void;
  guided?: boolean;
}

function messageTime(createdAt: string): string {
  const value = new Date(createdAt);
  if (Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(value);
}

export function GuidePanel({ onClose, guided = false }: GuidePanelProps) {
  const allMessages = useLifeRoomStore((state) => state.guideMessages);
  const addGuideMessage = useLifeRoomStore((state) => state.addGuideMessage);
  const [draft, setDraft, clearDraft] = useTemporaryDraft("guide:message", { message: "" });
  const [shareContext, setShareContext] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messages = useMemo(() => guideMessagesForToday(allMessages), [allMessages]);
  const lastMessage = messages.at(-1);
  const currentReply = lastMessage?.role === "assistant" ? lastMessage : null;
  const history = currentReply ? messages.slice(0, -1) : messages;

  async function send(message: string) {
    const text = message.trim();
    if (!text || sending) return;
    addGuideMessage({ role: "user", content: text, includedRoomRecords: shareContext });
    clearDraft({ message: "" });
    setSending(true);
    setError("");
    try {
      const snapshot = getLifeRoomSnapshot();
      const recentConversation = guideMessagesForToday(snapshot.guideMessages).slice(-12);
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: shareContext ? {
            profile: snapshot.hero,
            recentDiary: snapshot.diary.slice(0, 8),
            skills: snapshot.skills,
            skillRecords: snapshot.skillRecords.slice(0, 12),
            achievements: snapshot.achievements.filter((item) => item.status === "pinned").slice(0, 8),
            atmosphere: snapshot.atmosphere,
            recentConversation,
          } : { recentConversation },
        }),
      });
      if (!response.ok) throw new Error("The little crow is quiet right now.");
      const result = await response.json() as { reply: string; mode: "openai" | "local" };
      addGuideMessage({ role: "assistant", content: result.reply, mode: result.mode, includedRoomRecords: shareContext });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The little crow is quiet right now.");
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(draft.message);
  }

  function keepTypingInCompanion(event: KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation();
  }

  return (
    <div
      className="crow-companion-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="crow-companion-stage" role="dialog" aria-modal="true" aria-labelledby="crow-companion-title">
        <header className="crow-companion-header">
          <div><span className="crow-presence-dot" aria-hidden="true" /><h1 id="crow-companion-title">Life Room</h1><p>with the little crow</p></div>
          <button className="crow-close" type="button" onClick={onClose} aria-label="Close companion"><X size={23} /></button>
        </header>

        <section className="crow-live" aria-label="The little crow's current reply">
          <div className="crow-current-bubble" aria-live="polite" aria-busy={sending}>
            <p className="crow-current-label">the little crow · current reply</p>
            <p className={sending || !currentReply ? "crow-current-text is-waiting" : "crow-current-text"}>
              {sending || !currentReply ? "..." : currentReply.content}
            </p>
            <small>{currentReply?.mode === "local" ? "Local reflection" : currentReply ? "AI response" : "It is listening."}</small>
          </div>
          <div className="crow-portrait" role="img" aria-label="The small eight-legged crow" />
          <p className="crow-live-note"><strong>{sending ? "It is considering your words." : "It is listening."}</strong><span>When you ask again, the previous exchange moves into Today.</span></p>
        </section>

        <aside className="crow-history" aria-label="Today's conversation history">
          <header><div><p>Conversation</p><h2>Today</h2></div><small>kept until<br />midnight</small></header>
          <div className="crow-thread">
            {history.length === 0 && <p className="crow-empty-history">Your words will collect here for today.</p>}
            {history.map((message) => (
              <article key={message.id} className={"crow-history-bubble " + message.role}>
                <small>{message.role === "user" ? "You" : "Little crow"}{messageTime(message.createdAt) ? " · " + messageTime(message.createdAt) : ""}</small>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          <div className="crow-compose">
            {guided && <div className="crow-guided-writing" aria-label="Notes from two writers"><p className="line-a">○ Ask it one question.</p><p className="line-b">△ Room memories are shared only if you choose.</p></div>}
            {error && <p className="crow-error" role="alert">{error}</p>}
            <form className="crow-input" onSubmit={submit}>
              <label className="sr-only" htmlFor="crow-message">Say something to the little crow</label>
              <input
                id="crow-message"
                value={draft.message}
                onChange={(event) => setDraft({ message: event.target.value })}
                placeholder="Say something…"
                maxLength={2_000}
                autoComplete="off"
                onKeyDown={keepTypingInCompanion}
                onKeyUp={keepTypingInCompanion}
              />
              <button type="submit" disabled={!draft.message.trim() || sending} aria-label="Send message"><Send size={20} /></button>
            </form>
            <label className="crow-context-consent">
              <input type="checkbox" checked={shareContext} onChange={(event) => setShareContext(event.target.checked)} />
              <span>Let it read selected room memories</span>
              <Info size={14} aria-label="Saved room records are sent only for requests made while this is enabled." />
            </label>
          </div>
        </aside>
      </section>
    </div>
  );
}
