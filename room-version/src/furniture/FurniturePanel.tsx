"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Award,
  BedDouble,
  BookHeart,
  BookOpenText,
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ExternalLink,
  Leaf,
  ListTodo,
  Map,
  MessageCircleHeart,
  PenLine,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { friendlyDate, isCarriedForward, monthTitle, todayKey, toDateKey } from "@/domain/dates";
import type { PanelId, Todo } from "@/domain/types";
import { getLifeRoomSnapshot, useLifeRoomStore } from "@/store/useLifeRoomStore";

interface FurniturePanelProps {
  panel: PanelId;
  onClose: () => void;
  onNavigate: (panel: PanelId) => void;
}

const PANEL_META: Record<
  PanelId,
  { title: string; eyebrow: string; icon: typeof BookOpenText; skin: string }
> = {
  novel: { title: "Life Novel", eyebrow: "The room remembers", icon: BookOpenText, skin: "novel" },
  diary: { title: "Success Diary", eyebrow: "The bookshelf", icon: BookHeart, skin: "book" },
  quests: { title: "Main Quests", eyebrow: "The vision board", icon: Map, skin: "board" },
  todos: { title: "To-do List", eyebrow: "The writing desk", icon: ListTodo, skin: "paper" },
  guide: { title: "Mirror Guide", eyebrow: "A friend inside the dream", icon: Bot, skin: "mirror" },
  skills: { title: "Skill Tree", eyebrow: "The growing plant", icon: Leaf, skin: "plant" },
  hero: { title: "The Dreamer", eyebrow: "The bedside journal", icon: BedDouble, skin: "dream" },
  calendar: { title: "Calendar", eyebrow: "The wall calendar", icon: CalendarDays, skin: "calendar" },
  achievements: {
    title: "Achievement Wall",
    eyebrow: "The memories you chose to keep",
    icon: Award,
    skin: "gallery",
  },
};

export function FurniturePanel({ panel, onClose, onNavigate }: FurniturePanelProps) {
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
          {panel === "todos" && <TodoPanel />}
          {panel === "diary" && <DiaryPanel />}
          {panel === "quests" && <QuestPanel />}
          {panel === "skills" && <SkillPanel />}
          {panel === "hero" && <HeroPanel />}
          {panel === "achievements" && <AchievementPanel />}
          {panel === "calendar" && <CalendarPanel onNavigate={onNavigate} />}
          {panel === "guide" && <GuidePanel />}
          {panel === "novel" && <NovelPanel />}
        </div>
        <footer className="panel-footer">
          <span><kbd>Q</kbd> close</span>
          <span>Your room stays behind every page.</span>
        </footer>
      </section>
    </div>
  );
}

function TodoPanel() {
  const todos = useLifeRoomStore((state) => state.todos);
  const quests = useLifeRoomStore((state) => state.quests);
  const skills = useLifeRoomStore((state) => state.skills);
  const addTodo = useLifeRoomStore((state) => state.addTodo);
  const updateTodo = useLifeRoomStore((state) => state.updateTodo);
  const completeTodo = useLifeRoomStore((state) => state.completeTodo);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayKey());
  const [questId, setQuestId] = useState("");
  const [skillId, setSkillId] = useState("");

  const visible = useMemo(
    () => todos.filter((todo) => todo.status !== "archived").sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
    [todos],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    addTodo({
      title: title.trim(),
      scheduledDate: date,
      mainQuestId: questId || undefined,
      skillId: skillId || undefined,
    });
    setTitle("");
  }

  return (
    <div className="feature-stack">
      <form className="object-form paper-form" onSubmit={submit}>
        <div className="section-heading">
          <div><p className="overline">A new paper on the desk</p><h2>Write the next small action</h2></div>
          <PenLine size={20} aria-hidden="true" />
        </div>
        <label>
          Action
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What could gently move life forward?" />
        </label>
        <div className="form-grid form-grid-three">
          <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>Main Quest<select value={questId} onChange={(event) => setQuestId(event.target.value)}><option value="">None</option>{quests.filter((q) => q.active).map((quest) => <option key={quest.id} value={quest.id}>{quest.title}</option>)}</select></label>
          <label>Skill<select value={skillId} onChange={(event) => setSkillId(event.target.value)}><option value="">None</option>{skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></label>
        </div>
        <button className="primary-button" type="submit"><CirclePlus size={17} /> Add to desk</button>
      </form>

      <div className="record-list">
        {visible.map((todo) => (
          <article className={`record-card ${todo.status === "done" ? "is-done" : ""}`} key={todo.id}>
            <div className="record-card-main">
              <div className="record-title-row">
                <h3>{todo.title}</h3>
                {isCarriedForward(todo.scheduledDate, todo.status) && <span className="soft-badge">Carried forward</span>}
              </div>
              <p className="record-meta">
                {todo.status === "done" ? "Completed" : friendlyDate(todo.scheduledDate)}
                {todo.originalScheduledDate !== todo.scheduledDate ? ` · began ${friendlyDate(todo.originalScheduledDate)}` : ""}
              </p>
            </div>
            <div className="record-actions">
              {todo.status === "open" && (
                <>
                  <input
                    className="compact-date"
                    aria-label={`Schedule ${todo.title}`}
                    type="date"
                    value={todo.scheduledDate}
                    onChange={(event) => updateTodo(todo.id, { scheduledDate: event.target.value })}
                  />
                  <button className="small-button" type="button" onClick={() => completeTodo(todo.id, true)}><Check size={15} /> Complete + diary</button>
                </>
              )}
              <button className="ghost-button icon-only" type="button" onClick={() => updateTodo(todo.id, { status: "archived" })} aria-label={`Archive ${todo.title}`}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
        {visible.length === 0 && <EmptyState icon={ListTodo} text="The desk is clear. Leave one small action when you are ready." />}
      </div>
    </div>
  );
}

function DiaryPanel() {
  const diary = useLifeRoomStore((state) => state.diary);
  const addDiary = useLifeRoomStore((state) => state.addDiary);
  const updateDiary = useLifeRoomStore((state) => state.updateDiary);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState(todayKey());

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    addDiary({ title: title.trim(), body: body.trim(), date });
    setTitle("");
    setBody("");
  }

  return (
    <div className="feature-stack book-layout">
      <form className="object-form book-page" onSubmit={submit}>
        <p className="overline">A page worth keeping</p>
        <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name the moment" /></label>
        <label>What happened?<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="A small success, reflection, or important moment…" rows={4} /></label>
        <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <button className="primary-button" type="submit"><BookHeart size={17} /> Place on the shelf</button>
      </form>
      <div className="record-list">
        {diary.map((entry) => (
          <article className="record-card diary-card" key={entry.id}>
            <div className="record-card-main">
              <p className="record-meta">{friendlyDate(entry.date)}</p>
              <input className="title-editor" value={entry.title} onChange={(event) => updateDiary(entry.id, { title: event.target.value })} aria-label="Diary title" />
              <textarea value={entry.body} onChange={(event) => updateDiary(entry.id, { body: event.target.value })} aria-label={`Edit ${entry.title}`} rows={3} />
            </div>
          </article>
        ))}
        {diary.length === 0 && <EmptyState icon={BookHeart} text="The shelf is waiting for the first moment you choose to keep." />}
      </div>
    </div>
  );
}

function QuestPanel() {
  const quests = useLifeRoomStore((state) => state.quests);
  const addQuest = useLifeRoomStore((state) => state.addQuest);
  const updateQuest = useLifeRoomStore((state) => state.updateQuest);
  const [title, setTitle] = useState("");
  const [intention, setIntention] = useState("");
  const activeCount = quests.filter((quest) => quest.active).length;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || activeCount >= 3) return;
    addQuest({ title: title.trim(), intention: intention.trim() });
    setTitle("");
    setIntention("");
  }

  return (
    <div className="feature-stack">
      <form className="object-form board-form" onSubmit={submit}>
        <p className="overline">Pinned direction · {activeCount}/3 active</p>
        <label>Quest title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What matters in this season?" disabled={activeCount >= 3} /></label>
        <label>Intention<textarea value={intention} onChange={(event) => setIntention(event.target.value)} placeholder="Why does it matter?" rows={2} disabled={activeCount >= 3} /></label>
        <button className="primary-button" type="submit" disabled={activeCount >= 3}><CirclePlus size={17} /> Pin a Main Quest</button>
      </form>
      <div className="quest-grid">
        {quests.map((quest, index) => (
          <article className={`quest-note note-${(index % 3) + 1}`} key={quest.id}>
            <p className="overline">Main Quest {index + 1}</p>
            <h3>{quest.title}</h3>
            <p>{quest.intention || "This direction is still finding its words."}</p>
            <label>Progress <strong>{quest.progress}%</strong><input type="range" min="0" max="100" value={quest.progress} onChange={(event) => updateQuest(quest.id, { progress: Number(event.target.value) })} /></label>
          </article>
        ))}
      </div>
    </div>
  );
}

function SkillPanel() {
  const skills = useLifeRoomStore((state) => state.skills);
  const addSkill = useLifeRoomStore((state) => state.addSkill);
  const updateSkill = useLifeRoomStore((state) => state.updateSkill);
  const [name, setName] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    addSkill(name.trim());
    setName("");
  }

  return (
    <div className="feature-stack">
      <form className="object-form plant-form" onSubmit={submit}>
        <p className="overline">Plant a capacity</p>
        <div className="inline-form"><label className="grow">Skill<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Listening, drawing, patience…" /></label><button className="primary-button" type="submit"><Leaf size={17} /> Plant</button></div>
      </form>
      <div className="skill-garden">
        {skills.map((skill) => (
          <article className="skill-pot" key={skill.id} style={{ "--growth": `${Math.max(12, skill.progress)}%` } as React.CSSProperties}>
            <div className="plant-visual" aria-hidden="true"><span className="stem" /><span className="leaf leaf-a" /><span className="leaf leaf-b" /><span className="leaf leaf-c" /></div>
            <div className="skill-copy"><h3>{skill.name}</h3><p>{skill.evidence.length} piece{skill.evidence.length === 1 ? "" : "s"} of evidence</p><label>Confirmed growth <strong>{skill.progress}%</strong><input type="range" min="0" max="100" value={skill.progress} onChange={(event) => updateSkill(skill.id, { progress: Number(event.target.value) })} /></label>{skill.evidence.slice(0, 2).map((item) => <small key={item}>{item}</small>)}</div>
          </article>
        ))}
      </div>
    </div>
  );
}

function HeroPanel() {
  const hero = useLifeRoomStore((state) => state.hero);
  const setHero = useLifeRoomStore((state) => state.setHero);
  return (
    <div className="hero-sheet">
      <div className="hero-portrait" aria-hidden="true"><span className="hero-hair" /><span className="hero-face">•‿•</span><span className="hero-scarf" /></div>
      <div className="hero-fields">
        <p className="overline">The person dreaming this room</p>
        <label>Name<input value={hero.name} onChange={(event) => setHero({ ...hero, name: event.target.value })} /></label>
        <label>Pronouns<input value={hero.pronouns} onChange={(event) => setHero({ ...hero, pronouns: event.target.value })} placeholder="Optional" /></label>
        <label>Current life theme<textarea value={hero.currentTheme} onChange={(event) => setHero({ ...hero, currentTheme: event.target.value })} rows={2} /></label>
        <label>A note to myself<textarea value={hero.reflection} onChange={(event) => setHero({ ...hero, reflection: event.target.value })} rows={3} /></label>
        <p className="gentle-note">No levels, health, or energy. This page describes identity, not performance.</p>
      </div>
    </div>
  );
}

function AchievementPanel() {
  const achievements = useLifeRoomStore((state) => state.achievements);
  const confirmAchievement = useLifeRoomStore((state) => state.confirmAchievement);
  const addAchievement = useLifeRoomStore((state) => state.addAchievement);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    addAchievement({ title: title.trim(), description: description.trim(), confirmed: true });
    setTitle("");
    setDescription("");
  }

  return (
    <div className="feature-stack">
      <form className="object-form gallery-form" onSubmit={submit}>
        <p className="overline">Frame a meaningful milestone</p>
        <div className="form-grid"><label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Why it matters<input value={description} onChange={(event) => setDescription(event.target.value)} /></label></div>
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

function CalendarPanel({ onNavigate }: { onNavigate: (panel: PanelId) => void }) {
  const todos = useLifeRoomStore((state) => state.todos);
  const diary = useLifeRoomStore((state) => state.diary);
  const events = useLifeRoomStore((state) => state.events);
  const annotations = useLifeRoomStore((state) => state.annotations);
  const addTodo = useLifeRoomStore((state) => state.addTodo);
  const updateTodo = useLifeRoomStore((state) => state.updateTodo);
  const completeTodo = useLifeRoomStore((state) => state.completeTodo);
  const addDiary = useLifeRoomStore((state) => state.addDiary);
  const updateDiary = useLifeRoomStore((state) => state.updateDiary);
  const addEvent = useLifeRoomStore((state) => state.addEvent);
  const setAnnotation = useLifeRoomStore((state) => state.setAnnotation);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [newTask, setNewTask] = useState("");
  const [newDiary, setNewDiary] = useState("");
  const [newEvent, setNewEvent] = useState("");

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: first.getDay() }, () => null),
      ...Array.from({ length: days }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
    ];
  }, [month]);

  const selectedTodos = todos.filter((todo) => {
    if (todo.status === "archived") return false;
    if (selectedDate === todayKey() && todo.status === "open" && todo.scheduledDate < selectedDate) return true;
    return todo.scheduledDate === selectedDate;
  });
  const selectedDiary = diary.filter((entry) => entry.date === selectedDate);
  const selectedEvents = events.filter((event) => event.date === selectedDate);

  function shiftMonth(amount: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function addSelectedTask(event: FormEvent) {
    event.preventDefault();
    if (!newTask.trim()) return;
    addTodo({ title: newTask.trim(), scheduledDate: selectedDate });
    setNewTask("");
  }

  function addSelectedDiary(event: FormEvent) {
    event.preventDefault();
    if (!newDiary.trim()) return;
    addDiary({ date: selectedDate, title: "A note from the calendar", body: newDiary.trim() });
    setNewDiary("");
  }

  function addSelectedEvent(event: FormEvent) {
    event.preventDefault();
    if (!newEvent.trim()) return;
    addEvent({ date: selectedDate, title: newEvent.trim() });
    setNewEvent("");
  }

  return (
    <div className="calendar-layout">
      <section className="month-sheet">
        <header className="month-header"><button className="icon-button" type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft /></button><h2>{monthTitle(month)}</h2><button className="icon-button" type="button" onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight /></button></header>
        <div className="weekday-row">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="month-grid">
          {cells.map((date, index) => {
            if (!date) return <span className="day-cell is-empty" key={`empty-${index}`} />;
            const key = toDateKey(date);
            const dayTodos = todos.filter((todo) => todo.scheduledDate === key && todo.status !== "archived");
            const hasDiary = diary.some((entry) => entry.date === key);
            const hasEvent = events.some((entry) => entry.date === key);
            const hasAnnotation = Boolean(annotations[key]?.trim());
            return (
              <button className={`day-cell ${key === selectedDate ? "is-selected" : ""} ${key === todayKey() ? "is-today" : ""}`} type="button" key={key} onClick={() => setSelectedDate(key)}>
                <strong>{date.getDate()}</strong>
                <span className="day-dots" aria-label={`${dayTodos.length} tasks${hasDiary ? ", diary entry" : ""}${hasAnnotation ? ", annotation" : ""}`}>
                  {dayTodos.length > 0 && <i className="dot task-dot" />}{hasDiary && <i className="dot diary-dot" />}{hasEvent && <i className="dot event-dot" />}{hasAnnotation && <i className="dot note-dot" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="day-sheet">
        <div className="section-heading"><div><p className="overline">Selected day</p><h2>{friendlyDate(selectedDate)}</h2></div><button className="small-button" type="button" onClick={() => onNavigate("todos")}><ExternalLink size={15} /> Open complete To-do List</button></div>
        <label>Annotation<textarea value={annotations[selectedDate] ?? ""} onChange={(event) => setAnnotation(selectedDate, event.target.value)} rows={2} placeholder="What should this day remember?" /></label>

        <div className="day-section"><h3>Tasks</h3><form className="inline-form" onSubmit={addSelectedTask}><input className="grow" value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add an action to this day" /><button className="small-button" type="submit"><CirclePlus size={15} /> Add</button></form>
          {selectedTodos.map((todo) => <CalendarTodoRow key={todo.id} todo={todo} updateTodo={updateTodo} completeTodo={completeTodo} />)}
          {selectedTodos.length === 0 && <p className="quiet-copy">No tasks on this date.</p>}
        </div>

        <div className="day-section"><h3>Success Diary</h3><form className="inline-form" onSubmit={addSelectedDiary}><input className="grow" value={newDiary} onChange={(event) => setNewDiary(event.target.value)} placeholder="Add a reflection" /><button className="small-button" type="submit"><BookHeart size={15} /> Keep</button></form>
          {selectedDiary.map((entry) => <textarea className="calendar-entry" key={entry.id} value={entry.body} onChange={(event) => updateDiary(entry.id, { body: event.target.value })} aria-label={`Edit ${entry.title}`} rows={2} />)}
          {selectedDiary.length === 0 && <p className="quiet-copy">No diary entry on this date.</p>}
        </div>

        <div className="day-section"><h3>Events</h3><form className="inline-form" onSubmit={addSelectedEvent}><input className="grow" value={newEvent} onChange={(event) => setNewEvent(event.target.value)} placeholder="Add an event" /><button className="small-button" type="submit"><CalendarDays size={15} /> Add</button></form>{selectedEvents.map((event) => <p className="event-row" key={event.id}>{event.title}</p>)}</div>
      </section>
    </div>
  );
}

function CalendarTodoRow({ todo, updateTodo, completeTodo }: { todo: Todo; updateTodo: (id: string, patch: Partial<Todo>) => void; completeTodo: (id: string, addDiary: boolean) => void }) {
  return (
    <div className={`calendar-task ${todo.status === "done" ? "is-done" : ""}`}>
      <div><strong>{todo.title}</strong>{isCarriedForward(todo.scheduledDate, todo.status) && <span className="soft-badge">Carried forward from {todo.originalScheduledDate}</span>}</div>
      {todo.status === "open" && <div className="record-actions"><input className="compact-date" type="date" value={todo.scheduledDate} onChange={(event) => updateTodo(todo.id, { scheduledDate: event.target.value })} aria-label={`Reschedule ${todo.title}`} /><button className="icon-button" type="button" onClick={() => completeTodo(todo.id, true)} aria-label={`Complete ${todo.title}`}><Check size={17} /></button></div>}
    </div>
  );
}

function GuidePanel() {
  const messages = useLifeRoomStore((state) => state.guideMessages);
  const addGuideMessage = useLifeRoomStore((state) => state.addGuideMessage);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim() || sending) return;
    const userText = message.trim();
    addGuideMessage({ role: "user", content: userText });
    setMessage("");
    setSending(true);
    setError("");
    try {
      const snapshot = getLifeRoomSnapshot();
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          context: {
            hero: snapshot.hero,
            openTodos: snapshot.todos.filter((todo) => todo.status === "open").slice(0, 8),
            recentDiary: snapshot.diary.slice(0, 5),
            quests: snapshot.quests.filter((quest) => quest.active),
            skills: snapshot.skills,
          },
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
        <form className="mirror-form" onSubmit={submit}><label className="sr-only" htmlFor="guide-message">Tell the mirror</label><textarea id="guide-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell the mirror what you are noticing…" rows={2} /><button className="primary-button" type="submit" disabled={sending}><MessageCircleHeart size={17} /> Speak</button></form>
        <p className="gentle-note">The Mirror may suggest. Memories and evaluations are saved only when you choose.</p>
      </div>
    </div>
  );
}

function NovelPanel() {
  const hero = useLifeRoomStore((state) => state.hero);
  const diary = useLifeRoomStore((state) => state.diary);
  const achievements = useLifeRoomStore((state) => state.achievements);
  const quests = useLifeRoomStore((state) => state.quests);
  const chapters = useLifeRoomStore((state) => state.chapters);
  const saveChapter = useLifeRoomStore((state) => state.saveChapter);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("Chapter One: The Room Begins to Remember");

  function generateDraft() {
    const recent = diary.slice(0, 3).map((entry) => entry.title).join(", ");
    const quest = quests.find((item) => item.active)?.title;
    const milestone = achievements.find((item) => item.confirmed)?.title;
    setDraft(
      `${hero.name} returned to the room with no need to prove anything. ${recent ? `On the bookshelf waited the memory of ${recent}. ` : "The bookshelf was still waiting for its first chosen memory. "}${quest ? `Above the room, the vision board held one direction: ${quest}. ` : "The vision board waited for a direction worth choosing. "}${milestone ? `A new frame on the wall was called “${milestone}.” ` : "The achievement wall remained open to a milestone that felt true."} The room did not count the day. It kept it.`,
    );
  }

  function save(approved: boolean) {
    if (!draft.trim()) return;
    saveChapter({ title: title.trim() || "Untitled chapter", period: new Date().toISOString().slice(0, 7), body: draft.trim(), approved });
  }

  return (
    <div className="novel-layout">
      <section className="novel-editor"><p className="overline">Approved records only</p><label>Chapter title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Draft<textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={10} placeholder="Generate a draft from the room, then make it yours." /></label><div className="button-row"><button className="small-button" type="button" onClick={generateDraft}><Sparkles size={16} /> Generate local draft</button><button className="primary-button" type="button" onClick={() => save(true)} disabled={!draft.trim()}><BookOpenText size={16} /> Approve chapter</button></div></section>
      <section className="chapter-shelf"><h2>Saved chapters</h2>{chapters.map((chapter) => <article className="chapter-card" key={chapter.id}><p className="overline">{chapter.period} · {chapter.approved ? "Approved" : "Draft"}</p><h3>{chapter.title}</h3><p>{chapter.body}</p></article>)}{chapters.length === 0 && <EmptyState icon={BookOpenText} text="Your first chapter can begin when the room has something you want to keep." />}</section>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof BookOpenText; text: string }) {
  return <div className="empty-state"><Icon size={24} aria-hidden="true" /><p>{text}</p></div>;
}
