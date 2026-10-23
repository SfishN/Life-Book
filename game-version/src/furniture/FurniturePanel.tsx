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
import type { OnboardingStep } from "@/domain/onboarding";
import { getRoomCue } from "@/onboarding/roomCues";
import { AchievementPanel } from "./panels/AchievementPanel";
import { DiaryPanel } from "./panels/DiaryPanel";
import { GuidePanel } from "./panels/GuidePanel";
import { NovelPanel } from "./panels/NovelPanel";
import { ProfilePanel } from "./panels/ProfilePanel";
import { SkillPanel } from "./panels/SkillPanel";

interface FurniturePanelProps {
  panel: PanelId;
  instructionStep?: OnboardingStep;
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

const PANEL_WRITING: Partial<Record<PanelId, { round: string; sharp: string }>> = {
  skills: { round: "Do it a few more times and it becomes a habit later.", sharp: "Do not pass off the ending as the process. Leave a practice record first." },
  hero: { round: "At least tell the room what to call you.", sharp: "Write the name. The room keeps things longer than people do." },
  achievements: { round: "This wall will be full later.", sharp: "If the person living now chooses to pin anything to it." },
  novel: { round: "Put them together. The chapter will be super good.", sharp: "You should know that the one in the middle doesn't have to write it." },
};

export function FurniturePanel({ panel, instructionStep, onClose, onDiarySaved }: FurniturePanelProps) {
  const guided = getRoomCue(instructionStep ?? "complete")?.panel === panel;
  if (panel === "guide") return <GuidePanel onClose={onClose} guided={guided} />;

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
          {guided && PANEL_WRITING[panel] && <div className="panel-handwritten-cue" aria-label="Notes from two writers"><p className="line-a">{PANEL_WRITING[panel].round}</p><p className="line-b">{PANEL_WRITING[panel].sharp}</p></div>}
          {panel === "diary" && <DiaryPanel onSaved={onDiarySaved} guided={guided} />}
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
