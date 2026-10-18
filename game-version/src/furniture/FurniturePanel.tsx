"use client";

import {
  Award,
  BookHeart,
  BookOpenText,
  Bird,
  Leaf,
  UserRound,
  X,
} from "lucide-react";
import type { PanelId } from "@/domain/types";
import { AchievementPanel } from "./panels/AchievementPanel";
import { DiaryPanel } from "./panels/DiaryPanel";
import { GuidePanel } from "./panels/GuidePanel";
import { NovelPanel } from "./panels/NovelPanel";
import { ProfilePanel } from "./panels/ProfilePanel";
import { SkillPanel } from "./panels/SkillPanel";

interface FurniturePanelProps {
  panel: PanelId;
  onClose: () => void;
  onDiarySaved: () => void;
}

const PANEL_META: Record<PanelId, { title: string; icon: typeof BookOpenText; skin: string }> = {
  diary: { title: "Diary", icon: BookHeart, skin: "book" },
  novel: { title: "Life Novel", icon: BookOpenText, skin: "novel" },
  achievements: { title: "Achievement Wall", icon: Award, skin: "gallery" },
  hero: { title: "Profile", icon: UserRound, skin: "dream" },
  guide: { title: "AI Companion", icon: Bird, skin: "companion" },
  skills: { title: "Skill Tree", icon: Leaf, skin: "plant" },
};

export function FurniturePanel({ panel, onClose, onDiarySaved }: FurniturePanelProps) {
  if (panel === "guide") return <GuidePanel onClose={onClose} />;

  const meta = PANEL_META[panel];
  const Icon = meta.icon;
  return (
    <div
      className="panel-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={"furniture-panel life-modal skin-" + meta.skin}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
        <header className="panel-header life-modal-header">
          <div className="panel-title-wrap">
            <span className="panel-icon" aria-hidden="true"><Icon size={23} /></span>
            <h1 id="panel-title">{meta.title}</h1>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close panel">
            <X size={22} />
          </button>
        </header>
        <div className="panel-content life-modal-content">
          {panel === "diary" && <DiaryPanel onSaved={onDiarySaved} />}
          {panel === "skills" && <SkillPanel />}
          {panel === "hero" && <ProfilePanel />}
          {panel === "achievements" && <AchievementPanel />}
          {panel === "novel" && <NovelPanel />}
        </div>
        <footer className="panel-footer life-modal-footer"><kbd>Esc</kbd> to close</footer>
      </section>
    </div>
  );
}
