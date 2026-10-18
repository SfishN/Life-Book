"use client";

import { type FormEvent, useMemo, useState } from "react";
import { ChevronRight, Leaf, Plus, Sparkles } from "lucide-react";
import { friendlyDate } from "@/domain/dates";
import { useLifeRoomStore } from "@/store/useLifeRoomStore";

export function SkillPanel() {
  const allSkills = useLifeRoomStore((state) => state.skills);
  const skills = useMemo(() => allSkills.filter((skill) => skill.status === "active"), [allSkills]);
  const skillRecords = useLifeRoomStore((state) => state.skillRecords);
  const addSkill = useLifeRoomStore((state) => state.addSkill);
  const updateSkill = useLifeRoomStore((state) => state.updateSkill);
  const [selectedId, setSelectedId] = useState(skills[0]?.id ?? "");
  const [newSkill, setNewSkill] = useState("");
  const [showWhy, setShowWhy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const selected = skills.find((skill) => skill.id === selectedId) ?? skills[0];
  const records = useMemo(
    () => skillRecords.filter((record) => record.skillId === selected?.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)),
    [selected?.id, skillRecords],
  );
  const current = selected ? Math.min(records.length, selected.targetRecordCount) : 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!newSkill.trim()) return;
    addSkill(newSkill);
    setNewSkill("");
  }

  async function generatePlan() {
    if (!selected || generating) return;
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "growth_plan",
          skill: selected,
          records: records.slice(0, 8),
        }),
      });
      if (!response.ok) throw new Error("The growth plan is unavailable right now.");
      const result = await response.json() as { plan: string };
      updateSkill(selected.id, { growthPlan: result.plan });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The growth plan is unavailable right now.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="skill-tree-layout">
      <aside className="skill-sidebar">
        <div className="section-heading inline">
          <h2>My Skills</h2>
          <form onSubmit={submit} className="compact-add">
            <input value={newSkill} onChange={(event) => setNewSkill(event.target.value)} placeholder="New skill" aria-label="New skill" />
            <button type="submit" className="soft-button" disabled={!newSkill.trim()}><Plus size={15} /> Add</button>
          </form>
        </div>
        <div className="skill-list">
          {skills.map((skill) => (
            <button type="button" key={skill.id} className={selected?.id === skill.id ? "skill-list-row is-selected" : "skill-list-row"} onClick={() => { setSelectedId(skill.id); setShowWhy(false); }}>
              <span className="skill-leaf" style={{ color: skill.color }}><Leaf size={24} fill="currentColor" /></span>
              <span>{skill.name}</span><ChevronRight size={17} />
            </button>
          ))}
        </div>
      </aside>
      {selected ? (
        <section className="skill-detail">
          <div className="skill-title-line"><Leaf size={28} color={selected.color} fill={selected.color} /><input value={selected.name} onChange={(event) => updateSkill(selected.id, { name: event.target.value })} aria-label="Skill name" /></div>
          <article className="detail-card growth-plan">
            <div className="section-heading inline"><h3>AI Growth Plan</h3><button className="soft-button" type="button" onClick={generatePlan} disabled={generating}><Sparkles size={15} /> {generating ? "Thinking…" : "Refresh"}</button></div>
            <p>{selected.growthPlan}</p>
            {error && <p className="form-error">{error}</p>}
          </article>
          <article className="detail-card linked-diary">
            <div><strong>Skill Diary (Linked)</strong><small>{records.length} skill records</small></div><ChevronRight size={19} />
          </article>
          <article className="detail-card skill-progress">
            <h3>Progress</h3>
            <div className="progress-row"><div className="progress-track"><span style={{ width: Math.min(100, current / selected.targetRecordCount * 100) + "%" }} /></div><strong>{current} / {selected.targetRecordCount}</strong></div>
            <button type="button" className="why-progress" onClick={() => setShowWhy((value) => !value)}><Sparkles size={16} /> Why this progress?<ChevronRight size={17} /></button>
            {showWhy && <div className="progress-evidence">
              {records.length ? records.map((record) => <div key={record.id}><time>{friendlyDate(record.date)}</time><p>{record.practice}</p></div>) : <p>No Skill Records yet. Add one from Diary → Skill record.</p>}
            </div>}
          </article>
        </section>
      ) : <div className="panel-empty"><Leaf size={24} /><p>Add a skill to begin.</p></div>}
    </div>
  );
}
