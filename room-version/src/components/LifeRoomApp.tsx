"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BedDouble,
  BookHeart,
  BookOpenText,
  Bot,
  CalendarDays,
  DoorOpen,
  HelpCircle,
  Leaf,
  ListTodo,
  Map,
  Menu,
  RotateCcw,
  X,
} from "lucide-react";
import type { PanelId } from "@/domain/types";
import { FurniturePanel } from "@/furniture/FurniturePanel";
import { RoomGame } from "@/room/RoomGame";
import { useLifeRoomStore } from "@/store/useLifeRoomStore";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

interface Proximity {
  panel: PanelId;
  label: string;
}

const ROOM_INDEX: Array<{ id: PanelId; label: string; object: string; icon: typeof ListTodo }> = [
  { id: "todos", label: "To-do List", object: "Desk", icon: ListTodo },
  { id: "diary", label: "Success Diary", object: "Bookshelf", icon: BookHeart },
  { id: "quests", label: "Main Quests", object: "Vision board", icon: Map },
  { id: "guide", label: "AI Guidance", object: "Mirror", icon: Bot },
  { id: "skills", label: "Skill Tree", object: "Plant", icon: Leaf },
  { id: "hero", label: "The Dreamer", object: "Bed", icon: BedDouble },
  { id: "calendar", label: "Calendar", object: "Wall calendar", icon: CalendarDays },
  { id: "achievements", label: "Achievements", object: "Achievement wall", icon: Award },
  { id: "novel", label: "Life Novel", object: "Room", icon: BookOpenText },
];

export function LifeRoomApp() {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [proximity, setProximity] = useState<Proximity | null>(null);
  const [showIndex, setShowIndex] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [showExit, setShowExit] = useState(false);
  const [safeToClose, setSafeToClose] = useState(false);
  const diaryCount = useLifeRoomStore((state) => state.diary.length);
  const confirmedAchievements = useLifeRoomStore(
    (state) => state.achievements.filter((item) => item.confirmed).length,
  );
  const chapterCount = useLifeRoomStore((state) => state.chapters.length);
  const openTodos = useLifeRoomStore((state) => state.todos.filter((todo) => todo.status === "open").length);
  const resetDemo = useLifeRoomStore((state) => state.resetDemo);

  const memoryLevel = diaryCount + confirmedAchievements * 2 + chapterCount * 3;

  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<Proximity>).detail;
      setActivePanel(detail.panel);
      setShowIndex(false);
    };
    const nearby = (event: Event) => setProximity((event as CustomEvent<Proximity | null>).detail);
    window.addEventListener("life-room:open", open);
    window.addEventListener("life-room:proximity", nearby);
    return () => {
      window.removeEventListener("life-room:open", open);
      window.removeEventListener("life-room:proximity", nearby);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key.toLowerCase() === "q" && activePanel && !typing) {
        event.preventDefault();
        setActivePanel(null);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setShowExit(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePanel]);

  function openPanel(panel: PanelId) {
    setActivePanel(panel);
    setShowIndex(false);
  }

  function attemptExit() {
    setSafeToClose(true);
    window.setTimeout(() => window.close(), 250);
  }

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    [],
  );

  return (
    <main className="life-room-app">
      <ServiceWorkerRegistration />
      <RoomGame paused={Boolean(activePanel || showHelp || showExit)} memoryLevel={memoryLevel} />
      <div className="room-vignette" aria-hidden="true" />

      <header className="room-header">
        <div>
          <p className="room-kicker">Life as a Room</p>
          <p className="room-date">{dateLabel}</p>
        </div>
        <div className="header-actions">
          <span className="room-status">{openTodos} open action{openTodos === 1 ? "" : "s"} · {memoryLevel} memories</span>
          <button className="glass-button" type="button" onClick={() => setShowHelp(true)}><HelpCircle size={17} /> Help</button>
          <button className="glass-button" type="button" onClick={() => setShowIndex((value) => !value)} aria-expanded={showIndex}><Menu size={17} /> Room index</button>
        </div>
      </header>

      {showIndex && (
        <nav className="room-index" aria-label="Furniture index">
          <header><div><p className="overline">Accessible room index</p><h2>Visit an object</h2></div><button className="icon-button" type="button" onClick={() => setShowIndex(false)} aria-label="Close room index"><X size={18} /></button></header>
          <div className="room-index-grid">
            {ROOM_INDEX.map((item) => {
              const Icon = item.icon;
              return <button type="button" key={item.id} onClick={() => openPanel(item.id)}><Icon size={18} /><span><strong>{item.object}</strong><small>{item.label}</small></span></button>;
            })}
          </div>
        </nav>
      )}

      <div className="interaction-area" aria-live="polite">
        {proximity ? (
          <button type="button" className="interaction-prompt" onClick={() => openPanel(proximity.panel)}>
            <kbd>E</kbd><span>Open {proximity.label}</span>
          </button>
        ) : (
          <div className="interaction-hint"><span><kbd>WASD</kbd> move</span><span><kbd>E</kbd> interact</span><span><kbd>Q</kbd> close</span></div>
        )}
      </div>

      {activePanel && (
        <FurniturePanel panel={activePanel} onClose={() => setActivePanel(null)} onNavigate={openPanel} />
      )}

      {showHelp && (
        <div className="intro-backdrop">
          <section className="intro-card" role="dialog" aria-modal="true" aria-labelledby="intro-title">
            <p className="overline">A room shaped by the life you live</p>
            <h1 id="intro-title">Welcome back, Dreamer.</h1>
            <p>This is not a game to win. Move through the room, open its objects, and let your real actions become a record you can return to.</p>
            <div className="control-row"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span><span><kbd>E</kbd> Interact</span><span><kbd>Q</kbd> Close page</span><span><kbd>Esc</kbd> Exit</span></div>
            <div className="intro-actions"><button className="primary-button" type="button" onClick={() => setShowHelp(false)}>Enter the room</button><button className="small-button" type="button" onClick={() => { resetDemo(); setShowHelp(false); }}><RotateCcw size={16} /> Reset demo records</button></div>
          </section>
        </div>
      )}

      {showExit && (
        <div className="intro-backdrop">
          <section className="exit-card" role="alertdialog" aria-modal="true" aria-labelledby="exit-title">
            <DoorOpen size={28} aria-hidden="true" />
            <h1 id="exit-title">Leave the room for now?</h1>
            {safeToClose ? <p>Your records are saved locally. It is safe to close this tab or app window.</p> : <p>Your local records are already saved. The room will be here when you return.</p>}
            <div className="button-row">{!safeToClose && <button className="primary-button" type="button" onClick={attemptExit}>Exit app</button>}<button className="small-button" type="button" onClick={() => { setShowExit(false); setSafeToClose(false); }}>{safeToClose ? "Return to room" : "Stay"}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
