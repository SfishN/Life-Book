"use client";

import { type FormEvent, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import type { HeroProfile, UserAttribute } from "@/domain/types";
import { useLifeRoomStore } from "@/store/useLifeRoomStore";
import { useTemporaryDraft } from "../useTemporaryDraft";

const ATTRIBUTE_COLORS = ["#e6a6b8", "#b4a0d2", "#9fc0b3", "#e8c36f", "#9db2dc", "#b0bd9d"];

export function ProfilePanel() {
  const hero = useLifeRoomStore((state) => state.hero);
  const attributes = useLifeRoomStore((state) => state.attributes);
  const setHero = useLifeRoomStore((state) => state.setHero);
  const addAttribute = useLifeRoomStore((state) => state.addAttribute);
  const updateAttribute = useLifeRoomStore((state) => state.updateAttribute);
  const removeAttribute = useLifeRoomStore((state) => state.removeAttribute);
  const [draft, setDraft, clearDraft] = useTemporaryDraft<HeroProfile>("profile", hero);
  const [newAttribute, setNewAttribute] = useState("");
  const [saved, setSaved] = useState(false);

  function save() {
    setHero(draft);
    clearDraft({ ...draft, updatedAt: new Date().toISOString() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function add(event: FormEvent) {
    event.preventDefault();
    if (!newAttribute.trim() || attributes.length >= 6) return;
    addAttribute(newAttribute, ATTRIBUTE_COLORS[attributes.length % ATTRIBUTE_COLORS.length]);
    setNewAttribute("");
  }

  return (
    <div className="profile-layout">
      <section className="profile-editor">
        <div className="profile-fields">
          <label>Name<input value={draft.name} maxLength={40} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
          <label>Gender
            <span className="profile-gender-control">
              <select value={draft.gender} onChange={(event) => setDraft((current) => ({ ...current, gender: event.target.value as HeroProfile["gender"] }))}>
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
              </select>
              <small>Room character follows this choice. Male uses the boy character; all other choices use the girl character.</small>
            </span>
          </label>
          <label>Motto<input value={draft.motto} maxLength={80} onChange={(event) => setDraft((current) => ({ ...current, motto: event.target.value }))} /></label>
        </div>
        <div className="section-heading inline"><h2>My Attributes</h2>
          <form className="attribute-add" onSubmit={add}>
            <input value={newAttribute} onChange={(event) => setNewAttribute(event.target.value)} placeholder="New attribute" aria-label="New attribute" disabled={attributes.length >= 6} />
            <button type="submit" className="soft-button" disabled={!newAttribute.trim() || attributes.length >= 6}><Plus size={15} /> Add</button>
          </form>
        </div>
        <div className="attribute-list">
          {attributes.map((attribute) => (
            <AttributeRow
              key={attribute.id}
              attribute={attribute}
              onUpdate={(patch) => updateAttribute(attribute.id, patch)}
              onRemove={() => removeAttribute(attribute.id)}
            />
          ))}
        </div>
        <div className="form-actions">
          {saved && <span className="form-success">Profile saved.</span>}
          <button type="button" className="primary-button" onClick={save}><Save size={16} /> Save profile</button>
        </div>
      </section>
      <section className="attribute-chart-card">
        <h2>My Attribute Profile</h2>
        <RadarChart attributes={attributes} />
        <p className="field-help">These levels are yours to confirm. AI may later suggest evidence, but it cannot change them automatically.</p>
      </section>
    </div>
  );
}

function AttributeRow({
  attribute,
  onUpdate,
  onRemove,
}: {
  attribute: UserAttribute;
  onUpdate: (patch: Partial<UserAttribute>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="attribute-row">
      <span className="attribute-dot" style={{ background: attribute.color }} />
      <input className="attribute-name" value={attribute.name} onChange={(event) => onUpdate({ name: event.target.value })} aria-label="Attribute name" />
      <label className="attribute-level">Level {attribute.level}
        <input type="range" min="1" max="5" value={attribute.level} onChange={(event) => onUpdate({ level: Number(event.target.value) })} />
      </label>
      <button type="button" className="icon-button" onClick={onRemove} aria-label={"Remove " + attribute.name}><X size={16} /></button>
    </div>
  );
}

function RadarChart({ attributes }: { attributes: UserAttribute[] }) {
  const display = attributes.slice(0, 6);
  const center = 150;
  const radius = 92;
  const axes = Math.max(display.length, 3);
  const point = (index: number, scale = 1) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / axes;
    return [center + Math.cos(angle) * radius * scale, center + Math.sin(angle) * radius * scale] as const;
  };
  const polygon = (scale: number) => Array.from({ length: axes }, (_, index) => point(index, scale).join(",")).join(" ");
  const valuePolygon = display.map((attribute, index) => point(index, attribute.level / 5).join(",")).join(" ");

  return (
    <svg className="radar-chart" viewBox="0 0 300 300" role="img" aria-label="Attribute radar chart">
      {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={polygon(scale)} fill="none" stroke="#c9bec8" strokeWidth="1" />)}
      {Array.from({ length: axes }, (_, index) => {
        const [x, y] = point(index);
        return <line key={index} x1={center} y1={center} x2={x} y2={y} stroke="#d6ccd4" />;
      })}
      {display.length >= 3 && <polygon points={valuePolygon} fill="#9d86b655" stroke="#8d72a5" strokeWidth="2" />}
      {display.map((attribute, index) => {
        const [x, y] = point(index, 1.24);
        const [dotX, dotY] = point(index, attribute.level / 5);
        return <g key={attribute.id}><circle cx={dotX} cy={dotY} r="4" fill="#8d72a5" /><text x={x} y={y} textAnchor="middle" dominantBaseline="middle">{attribute.name}</text></g>;
      })}
    </svg>
  );
}
