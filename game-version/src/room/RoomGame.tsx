"use client";

import { useEffect, useRef } from "react";
import { FINAL_NOTE_ORDER, type FinalNote, type FinalNotesRead, type OnboardingStep } from "@/domain/onboarding";
import type { HeroProfile, PanelId, RoomAtmosphere } from "@/domain/types";
import { getMoodPreset } from "@/domain/mood";
import { getPanelAccess, getRoomCue } from "@/onboarding/roomCues";

interface RoomGameProps {
  paused: boolean;
  memoryLevel: number;
  atmosphere: RoomAtmosphere;
  onboardingStep: OnboardingStep;
  finalNotesRead: FinalNotesRead;
  heroGender: HeroProfile["avatarStyle"];
}

type RoomVisualState = Pick<RoomGameProps, "memoryLevel" | "atmosphere">;
const HERO_DISPLAY_HEIGHT = 160;
const HERO_FRAME_SIZE = 320;
const HERO_WALK_FRAMES = [1, 2, 3, 2] as const;
const CROW_SPRITE_SCALE = 0.34;
const CROW_INTERACTION_OFFSET_X = 105;
const ROOM_WALK_SPEED = 300;
const INTRODUCTION_WALK_SPEED = 420;
const FINAL_PAPER_POSITIONS: Record<FinalNote, readonly [number, number]> = {
  reveal: [590, 790],
  crow: [765, 790],
  adoption: [940, 790],
};
const ROOM_WORLD_WIDTH = 1536;
const ROOM_WORLD_HEIGHT = 1024;
const CAMERA_PAN_THRESHOLD = 10;
const CAMERA_OVERSCAN_AFTER_VERTICAL_FILL = 1.2;
const MAX_ROOM_ZOOM = 4.2;
const MAX_RENDER_DENSITY = 4;
const MAX_RENDER_PIXELS = 6_000_000;
const MAX_RENDER_EDGE = 4096;
const PAPER_INTERACTION_RADIUS = 105;
type IntroAction = "envelope" | "window" | "sweep" | "mirror";
type RoomKey = "up" | "down" | "left" | "right" | "arrowUp" | "arrowDown" | "arrowLeft" | "arrowRight" | "interact";

interface Hotspot {
  id: PanelId;
  label: string;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  clickAreas: Array<readonly [number, number, number, number]>;
}

interface IntroductionHotspot {
  action: Exclude<IntroAction, "sweep">;
  label: string;
  x: number;
  y: number;
  radius: number;
  clickX?: number;
  clickY?: number;
  clickRadius?: number;
}

const HOTSPOTS: Hotspot[] = [
  { id: "achievements", label: "Achievement Wall", x: 990, y: 625, radiusX: 70, radiusY: 48, clickAreas: [[865, 180, 155, 175], [1000, 225, 150, 85], [1000, 325, 100, 80], [960, 555, 75, 90]] },
  { id: "guide", label: "Little Crow", x: 535, y: 650, radiusX: 75, radiusY: 42, clickAreas: [[390, 590, 80, 115]] },
  { id: "diary", label: "Diary", x: 365, y: 645, radiusX: 75, radiusY: 38, clickAreas: [[225, 280, 170, 360]] },
  { id: "skills", label: "Skill Tree", x: 430, y: 760, radiusX: 75, radiusY: 42, clickAreas: [[300, 620, 115, 145]] },
  { id: "hero", label: "Profile", x: 790, y: 645, radiusX: 100, radiusY: 48, clickAreas: [[545, 255, 500, 355]] },
  { id: "novel", label: "Life Novel", x: 1080, y: 730, radiusX: 105, radiusY: 50, clickAreas: [[980, 470, 420, 260]] },
];

function insideHotspot(x: number, y: number, hotspot: Hotspot, centerX = hotspot.x, centerY = hotspot.y): boolean {
  const relativeX = (x - centerX) / hotspot.radiusX;
  const relativeY = (y - centerY) / hotspot.radiusY;
  return relativeX * relativeX + relativeY * relativeY <= 1 || hotspot.clickAreas.some(([left, top, width, height]) =>
    x >= left && x <= left + width && y >= top && y <= top + height);
}

type RoomPoint = readonly [number, number];
type RoomPolygon = readonly RoomPoint[];

// The character position is its feet. These points follow the visible tile outline.
const WALKABLE_FLOOR: RoomPolygon = [[765, 390], [1400, 622], [765, 1000], [130, 622]];
const SOLID_FURNITURE: readonly RoomPolygon[] = [
  [[230, 545], [395, 545], [395, 635], [230, 635]], // bookshelf
  [[425, 520], [545, 520], [555, 605], [425, 605]], // mirror
  [[545, 430], [755, 470], [1040, 535], [1040, 605], [785, 625], [545, 560]], // bed and bedside table
  [[1000, 500], [1280, 500], [1290, 650], [1160, 675], [1130, 710], [1000, 690], [980, 625]], // desk and chair
  [[310, 665], [390, 665], [410, 740], [370, 780], [305, 750]], // floor plant
];
const HERO_FOOT_CLEARANCE = 32;
const FURNITURE_COLLISION_INSET = 20;

function pointInPolygon(x: number, y: number, polygon: RoomPolygon): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distanceToEdges(x: number, y: number, polygon: RoomPolygon): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < polygon.length; index += 1) {
    const [ax, ay] = polygon[index];
    const [bx, by] = polygon[(index + 1) % polygon.length];
    const dx = bx - ax;
    const dy = by - ay;
    const along = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    nearest = Math.min(nearest, Math.hypot(x - ax - along * dx, y - ay - along * dy));
  }
  return nearest;
}

function canStandAt(x: number, y: number): boolean {
  if (!pointInPolygon(x, y, WALKABLE_FLOOR) || distanceToEdges(x, y, WALKABLE_FLOOR) < HERO_FOOT_CLEARANCE) return false;
  return SOLID_FURNITURE.every((footprint) =>
    !pointInPolygon(x, y, footprint) || distanceToEdges(x, y, footprint) <= FURNITURE_COLLISION_INSET);
}

function getRenderDensity(width: number, height: number): number {
  const deviceDensity = Math.max(1, Math.min(MAX_RENDER_DENSITY, window.devicePixelRatio || 1));
  const legacyRoomDensity = Math.min(MAX_RENDER_DENSITY, ROOM_WORLD_WIDTH / Math.max(1, width));
  const preferredDensity = Math.max(deviceDensity, legacyRoomDensity);
  const budgetDensity = Math.min(
    Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, width * height)),
    MAX_RENDER_EDGE / Math.max(1, width),
    MAX_RENDER_EDGE / Math.max(1, height),
  );
  return Math.max(1, Math.min(preferredDensity, budgetDensity));
}

const INTRODUCTION_HOTSPOTS: Record<"envelope" | "window" | "mirror", IntroductionHotspot> = {
  envelope: { action: "envelope", label: "Open the glowing envelope", x: 1160, y: 665, radius: 180 },
  window: { action: "window", label: "Inspect the mark on the window", x: 1195, y: 705, radius: 130, clickX: 1200, clickY: 445, clickRadius: 165 },
  mirror: { action: "mirror", label: "Look behind the mirror", x: 520, y: 650, radius: 130, clickX: 490, clickY: 455, clickRadius: 150 },
};

export function RoomGame({ paused, memoryLevel, atmosphere, onboardingStep, finalNotesRead, heroGender }: RoomGameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const visualRef = useRef<RoomVisualState>({ memoryLevel, atmosphere });
  const onboardingRef = useRef({ step: onboardingStep, finalNotesRead });
  const heroGenderRef = useRef(heroGender);
  const gameRef = useRef<{ destroy: (removeCanvas: boolean, noReturn?: boolean) => void } | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    window.dispatchEvent(new CustomEvent("life-room:pause", { detail: { paused } }));
  }, [paused]);

  useEffect(() => {
    visualRef.current = { memoryLevel, atmosphere };
    window.dispatchEvent(new CustomEvent("life-room:memory", { detail: visualRef.current }));
  }, [memoryLevel, atmosphere]);

  useEffect(() => {
    onboardingRef.current = { step: onboardingStep, finalNotesRead };
    window.dispatchEvent(new CustomEvent("life-room:onboarding", { detail: onboardingRef.current }));
  }, [finalNotesRead, onboardingStep]);

  useEffect(() => {
    heroGenderRef.current = heroGender;
    window.dispatchEvent(new CustomEvent("life-room:hero-gender", { detail: heroGender }));
  }, [heroGender]);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function mountGame() {
      if (!hostRef.current || gameRef.current) return;
      const Phaser = (await import("phaser")).default;
      if (cancelled || !hostRef.current) return;

      class DreamRoomScene extends Phaser.Scene {
        private hero!: Phaser.GameObjects.Container;
        private heroSprite!: Phaser.GameObjects.Image;
        private heroFacing: "front" | "back" | "left" | "right" = "front";
        private heroWalkElapsed = 0;
        private currentGender: "female" | "male" = "female";
        private keys!: Record<RoomKey, Phaser.Input.Keyboard.Key>;
        private destination: Phaser.Math.Vector2 | null = null;
        private virtualMove = { x: 0, y: 0 };
        private pinchStartDistance = 0;
        private pinchStartRoomZoom = 1;
        private pinchFocusWorld = { x: ROOM_WORLD_WIDTH / 2, y: ROOM_WORLD_HEIGHT / 2 };
        private roomZoom = 1;
        private baseCameraZoom = 1;
        private maxRoomZoom = 1.8;
        private cameraCenter = { x: ROOM_WORLD_WIDTH / 2, y: ROOM_WORLD_HEIGHT / 2 };
        private panPointerId: number | null = null;
        private panStart = { x: 0, y: 0 };
        private panLast = { x: 0, y: 0 };
        private cameraDragging = false;
        private gestureHadPinch = false;
        private nearest: Hotspot | null = null;
        private introNearest: IntroductionHotspot | null = null;
        private introPrompt = "";
        private paperPrompt = "";
        private panelOpen = false;
        private pauseFrame = 0;
        private memoryGlow!: Phaser.GameObjects.Particles.ParticleEmitter;
        private background!: Phaser.GameObjects.Image;
        private ambient!: Phaser.GameObjects.Rectangle;
        private windowLight!: Phaser.GameObjects.Image;
        private lampLight!: Phaser.GameObjects.Image;
        private saveHalo!: Phaser.GameObjects.Image;
        private instructionGlow!: Phaser.GameObjects.Image;
        private instructionPaper!: Phaser.GameObjects.Container;
        private secondInstructionPaper!: Phaser.GameObjects.Container;
        private thirdInstructionPaper!: Phaser.GameObjects.Container;
        private finalPapers!: Record<FinalNote, Phaser.GameObjects.Container>;
        private hotspotRings: Array<{ id: PanelId; ring: Phaser.GameObjects.Ellipse }> = [];
        private finalNotesRead: FinalNotesRead = { reveal: false, crow: false, adoption: false };
        private envelope!: Phaser.GameObjects.Sprite;
        private leafNote!: Phaser.GameObjects.Image;
        private net!: Phaser.GameObjects.Sprite;
        private pet!: Phaser.GameObjects.Sprite;
        private footprints!: Phaser.GameObjects.Image;
        private threateningShadow!: Phaser.GameObjects.Image;
        private windowMark!: Phaser.GameObjects.Graphics;
        private currentBird: Phaser.GameObjects.Container | null = null;
        private flock: Phaser.GameObjects.Container[] = [];
        private caughtCount = 0;
        private birdStartedAt = 0;
        private mirrorReady = false;
        private crowInteractionReady = false;
        private lastRevision = 0;
        private onboardingStep: OnboardingStep = "arrival";
        private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        private coarsePointer = window.matchMedia("(pointer: coarse)").matches;
        private lightTransition = { value: 0 };

        private onHeroGender = (event: Event) => {
          const gender = (event as CustomEvent<HeroProfile["avatarStyle"]>).detail;
          this.currentGender = gender === "boy" ? "male" : "female";
          if (this.heroSprite) {
            this.heroSprite.setTexture(`hero-${this.currentGender}`, `${this.heroFacing}-0`);
            this.heroSprite.setScale(HERO_DISPLAY_HEIGHT / this.heroSprite.height);
          }
        };
        private onPause = (event: Event) => {
          this.setPaused(Boolean((event as CustomEvent<{ paused: boolean }>).detail.paused));
        };
        private onMemory = (event: Event) => {
          this.applyVisualState((event as CustomEvent<RoomVisualState>).detail, true);
        };
        private onOnboarding = (event: Event) => {
          const detail = (event as CustomEvent<{ step: OnboardingStep; finalNotesRead: FinalNotesRead }>).detail;
          this.onboardingStep = detail.step;
          this.finalNotesRead = detail.finalNotesRead;
          this.applyOnboardingState();
        };
        private onOnboardingCommand = (event: Event) => {
          const action = (event as CustomEvent<{ action: IntroAction }>).detail.action;
          if (action === "sweep" && this.onboardingStep === "net") this.sweepNet();
          else if (this.introNearest?.action === action) this.performIntroductionAction(action);
        };
        private onInteractCommand = () => {
          this.performCurrentInteraction();
        };
        private onScaleResize = () => {
          this.layoutCamera();
        };
        private onVirtualMove = (event: Event) => {
          const detail = (event as CustomEvent<{ x?: number; y?: number }>).detail;
          const x = Number.isFinite(detail?.x) ? Number(detail.x) : 0;
          const y = Number.isFinite(detail?.y) ? Number(detail.y) : 0;
          const length = Math.hypot(x, y);
          this.virtualMove = length > 1 ? { x: x / length, y: y / length } : { x, y };
          if (length > 0.04) this.destination = null;
        };

        constructor() {
          super("dream-room");
        }

        preload() {
          this.load.image("room-composite", "/room/room-composite.png");
          this.load.image("hero-female", "/characters/girl-v2.webp");
          this.load.image("hero-male", "/characters/boy-v2.webp");
          this.load.spritesheet("intro-envelope", "/onboarding/objects/envelope-3f.webp", { frameWidth: 724, frameHeight: 724 });
          this.load.spritesheet("intro-net", "/onboarding/objects/net-sweep-8f.webp", { frameWidth: 443, frameHeight: 443, endFrame: 7 });
          this.load.spritesheet("intro-pet", "/onboarding/pet/pet-eight-legs-v5-8f.webp", { frameWidth: 512, frameHeight: 512, endFrame: 7 });
          this.load.image("intro-leaf", "/onboarding/notes/leaf-note.webp");
          this.load.image("intro-footprints", "/onboarding/pet/pet-footprint-8.webp");
          this.load.image("intro-shadow", "/onboarding/pet/pet-threatening-shadow.webp");
        }

        create() {
          this.input.addPointer(1);
          this.background = this.add.image(0, 0, "room-composite")
            .setOrigin(0, 0)
            .setDisplaySize(ROOM_WORLD_WIDTH, ROOM_WORLD_HEIGHT)
            .setDepth(0);

          const particlesTexture = this.textures.createCanvas("memory-speck", 12, 12);
          if (particlesTexture) {
            const ctx = particlesTexture.context;
            const gradient = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
            gradient.addColorStop(0, "rgba(255,238,166,0.95)");
            gradient.addColorStop(1, "rgba(255,238,166,0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 12, 12);
            particlesTexture.refresh();
          }
          this.ambient = this.add.rectangle(768, 512, 1536, 1024, 0xffffff, 0).setDepth(1);
          this.windowLight = this.add.image(1200, 430, "memory-speck").setDisplaySize(820, 900).setDepth(2).setBlendMode(Phaser.BlendModes.ADD);
          this.lampLight = this.add.image(1060, 520, "memory-speck").setDisplaySize(360, 330).setTint(0xffc575).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
          this.saveHalo = this.add.image(315, 465, "memory-speck").setDisplaySize(430, 490).setTint(0xffe3a1).setAlpha(0).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
          this.instructionGlow = this.add.image(0, 0, "memory-speck").setDisplaySize(270, 230).setTint(0xffdb8e).setAlpha(0).setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
          const foldedPaper = this.add.rectangle(0, 0, 54, 36, 0xf2dfbf).setRotation(-0.14).setStrokeStyle(2, 0x7b5c69, 0.8);
          const paperMarks = this.add.text(0, 0, "○  △", { fontFamily: "Georgia, serif", fontSize: "17px", color: "#594556" }).setOrigin(0.5);
          this.instructionPaper = this.add.container(0, 0, [foldedPaper, paperMarks]).setDepth(1000).setVisible(false);
          const secondFoldedPaper = this.add.rectangle(0, 0, 54, 36, 0xf2dfbf).setRotation(0.11).setStrokeStyle(2, 0x7b5c69, 0.8);
          const secondPaperMark = this.add.text(0, 0, "○", { fontFamily: "Georgia, serif", fontSize: "19px", color: "#704656" }).setOrigin(0.5);
          this.secondInstructionPaper = this.add.container(0, 0, [secondFoldedPaper, secondPaperMark]).setDepth(1000).setVisible(false);
          const thirdFoldedPaper = this.add.rectangle(0, 0, 54, 36, 0xf2dfbf).setRotation(-0.08).setStrokeStyle(2, 0x7b5c69, 0.8);
          const thirdPaperMark = this.add.text(0, 0, "△", { fontFamily: "Georgia, serif", fontSize: "19px", color: "#35404c" }).setOrigin(0.5);
          this.thirdInstructionPaper = this.add.container(0, 0, [thirdFoldedPaper, thirdPaperMark]).setDepth(1000).setVisible(false);
          this.finalPapers = { reveal: this.instructionPaper, crow: this.secondInstructionPaper, adoption: this.thirdInstructionPaper };
          this.memoryGlow = this.add.particles(315, 455, "memory-speck", {
            lifespan: { min: 1800, max: 3200 },
            speedY: { min: -18, max: -6 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.65, end: 0 },
            alpha: { start: 0.65, end: 0 },
            frequency: 700,
            emitting: !this.reducedMotion,
            quantity: 1,
            blendMode: Phaser.BlendModes.ADD,
          }).setDepth(3);

          for (const hotspot of HOTSPOTS) {
            const ring = this.add.ellipse(hotspot.x, hotspot.y, hotspot.radiusX * 2, hotspot.radiusY * 2)
              .setStrokeStyle(3, 0xffe7aa, 0.13)
              .setFillStyle(0xffe7aa, 0.015)
              .setDepth(2);
            this.hotspotRings.push({ id: hotspot.id, ring });
          }

          this.windowMark = this.createWindowMark();
          this.threateningShadow = this.add.image(768, 512, "intro-shadow").setDisplaySize(1536, 1024).setDepth(5).setAlpha(0).setVisible(false);
          this.footprints = this.add.image(350, 670, "intro-footprints").setDisplaySize(430, 215).setDepth(6).setAlpha(0.52).setVisible(false);
          this.leafNote = this.add.image(1200, 445, "intro-leaf").setDisplaySize(190, 190).setDepth(7).setVisible(false);
          this.envelope = this.add.sprite(1160, 655, "intro-envelope", 0).setDisplaySize(185, 185).setDepth(7).setVisible(false);
          this.net = this.add.sprite(0, 0, "intro-net", 0).setDisplaySize(150, 150).setDepth(9).setVisible(false);
          this.pet = this.add.sprite(430, 645, "intro-pet", 0).setScale(CROW_SPRITE_SCALE).setDepth(8).setVisible(false);

          if (!this.anims.exists("intro-net-sweep")) {
            this.anims.create({ key: "intro-net-sweep", frames: this.anims.generateFrameNumbers("intro-net", { start: 0, end: 7 }), frameRate: 16, repeat: 0 });
          }
          if (!this.anims.exists("intro-pet-flutter")) {
            this.anims.create({ key: "intro-pet-flutter", frames: this.anims.generateFrameNumbers("intro-pet", { start: 0, end: 7 }), frameRate: 9, repeat: -1 });
          }

          this.currentGender = heroGenderRef.current === "boy" ? "male" : "female";
          this.hero = this.createHero(745, 780).setDepth(8);
          this.layoutCamera();
          const keyboard = this.input.keyboard;
          if (keyboard) {
            this.keys = {
              up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W, false),
              down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S, false),
              left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A, false),
              right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D, false),
              arrowUp: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP, false),
              arrowDown: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN, false),
              arrowLeft: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT, false),
              arrowRight: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, false),
              interact: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E, false),
            };
          }

          this.input.on("pointerdown", this.startPointerGesture, this);
          this.input.on("pointermove", this.movePointerGesture, this);
          this.input.on("pointerup", this.finishPointerGesture, this);
          this.input.on("pointerupoutside", this.finishPointerGesture, this);
          this.scale.on(Phaser.Scale.Events.RESIZE, this.onScaleResize);

          window.addEventListener("life-room:hero-gender", this.onHeroGender);
          window.addEventListener("life-room:pause", this.onPause);
          window.addEventListener("life-room:memory", this.onMemory);
          window.addEventListener("life-room:onboarding", this.onOnboarding);
          window.addEventListener("life-room:onboarding-command", this.onOnboardingCommand);
          window.addEventListener("life-room:interact", this.onInteractCommand);
          window.addEventListener("life-room:virtual-move", this.onVirtualMove);
          this.applyVisualState(visualRef.current, false);
          this.onboardingStep = onboardingRef.current.step;
          this.finalNotesRead = onboardingRef.current.finalNotesRead;
          this.applyOnboardingState();
          this.pauseFrame = window.requestAnimationFrame(() => this.setPaused(pausedRef.current));
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.cancelAnimationFrame(this.pauseFrame);
            window.removeEventListener("life-room:hero-gender", this.onHeroGender);
            window.removeEventListener("life-room:pause", this.onPause);
            window.removeEventListener("life-room:memory", this.onMemory);
            window.removeEventListener("life-room:onboarding", this.onOnboarding);
            window.removeEventListener("life-room:onboarding-command", this.onOnboardingCommand);
            window.removeEventListener("life-room:interact", this.onInteractCommand);
            window.removeEventListener("life-room:virtual-move", this.onVirtualMove);
            this.scale.off(Phaser.Scale.Events.RESIZE, this.onScaleResize);
          });
        }

        private createWindowMark() {
          const mark = this.add.graphics().setDepth(6).setVisible(false);
          mark.lineStyle(5, 0xc9bcff, 0.82);
          mark.strokeCircle(1200, 420, 44);
          mark.lineBetween(1173, 430, 1224, 400);
          mark.lineBetween(1178, 398, 1220, 440);
          mark.lineStyle(2, 0xfff1c8, 0.75);
          mark.strokeCircle(1320, 480, 73);
          return mark;
        }

        private setPaused(pausedState: boolean) {
          this.panelOpen = pausedState;
          this.destination = null;
          this.virtualMove = { x: 0, y: 0 };
          this.panPointerId = null;
          this.cameraDragging = false;
          this.gestureHadPinch = false;
          this.pinchStartDistance = 0;
          this.input.keyboard?.resetKeys();
        }

        private applyOnboardingState() {
          if (!this.envelope) return;
          this.tweens.killTweensOf([this.envelope, this.windowMark, this.leafNote, this.footprints]);
          this.tweens.killTweensOf([this.pet, this.instructionGlow, this.instructionPaper, this.secondInstructionPaper, this.thirdInstructionPaper]);
          this.envelope.setVisible(this.onboardingStep === "envelope").setFrame(0).setScale(0.255).setAlpha(1);
          this.leafNote.setVisible(this.onboardingStep === "window").setAlpha(1);
          this.windowMark.setVisible(this.onboardingStep === "window" || this.onboardingStep === "net").setAlpha(1);
          this.net.setVisible(this.onboardingStep === "net");

          if (this.onboardingStep === "envelope" && !this.reducedMotion) {
            this.tweens.add({ targets: this.envelope, alpha: 0.62, scaleX: this.envelope.scaleX * 1.05, scaleY: this.envelope.scaleY * 1.05, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          }
          if ((this.onboardingStep === "window" || this.onboardingStep === "net") && !this.reducedMotion) {
            this.tweens.add({ targets: this.windowMark, alpha: 0.35, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          }

          if (this.onboardingStep === "net" && !this.currentBird) this.startNetSequence();
          if (this.onboardingStep !== "net") this.clearFlock();

          const petShouldStay = !["arrival", "envelope", "window", "net"].includes(this.onboardingStep);
          this.pet.setVisible(petShouldStay);
          if (petShouldStay && !this.reducedMotion) this.pet.play("intro-pet-flutter", true);
          else this.pet.stop().setFrame(0);
          this.pet.setScale(CROW_SPRITE_SCALE);

          if (this.onboardingStep === "mirror") this.startMirrorReveal();
          else this.mirrorReady = false;

          const roomCue = getRoomCue(this.onboardingStep);
          this.crowInteractionReady = this.onboardingStep === "complete";
          for (const { id, ring } of this.hotspotRings) {
            const unlocked = getPanelAccess(this.onboardingStep, id) !== "locked";
            ring.setVisible(unlocked && (id !== "guide" || this.crowInteractionReady));
          }
          this.instructionGlow.setVisible(Boolean(roomCue));
          if (this.onboardingStep === "reveal") {
            for (const note of FINAL_NOTE_ORDER) {
              this.finalPapers[note].setVisible(true).setPosition(...FINAL_PAPER_POSITIONS[note]).setScale(1.3).setAlpha(this.finalNotesRead[note] ? 0.62 : 1);
            }
          } else {
            this.instructionPaper.setVisible(Boolean(roomCue)).setScale(1);
            this.secondInstructionPaper.setVisible(false);
            this.thirdInstructionPaper.setVisible(false);
          }
          if (roomCue) {
            this.instructionGlow.setPosition(...roomCue.glow).setAlpha(0.45);
            if (this.onboardingStep !== "reveal") this.instructionPaper.setPosition(...roomCue.paper).setAlpha(1);
            this.footprints.setVisible(false);
            this.threateningShadow.setVisible(false).setAlpha(0);
            if (this.reducedMotion) {
              this.pet.setPosition(...roomCue.crow).setAlpha(0.92);
              this.crowInteractionReady = true;
              this.syncCrowInteractionRing();
            }
            else {
              const destinationStep = this.onboardingStep;
              this.tweens.add({
                targets: this.pet,
                x: roomCue.crow[0],
                y: roomCue.crow[1],
                alpha: 0.92,
                duration: 900,
                ease: "Sine.easeInOut",
                onComplete: () => {
                  if (this.onboardingStep !== destinationStep) return;
                  this.crowInteractionReady = true;
                  this.syncCrowInteractionRing();
                },
              });
              this.tweens.add({ targets: this.instructionGlow, alpha: 0.7, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
              if (this.onboardingStep === "reveal") {
                FINAL_NOTE_ORDER.forEach((note, index) => {
                  if (!this.finalNotesRead[note]) this.tweens.add({ targets: this.finalPapers[note], y: FINAL_PAPER_POSITIONS[note][1] - 6, duration: 1000 + index * 120, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
                });
              } else if (this.instructionPaper.visible) {
                this.tweens.add({ targets: this.instructionPaper, y: roomCue.paper[1] - 6, duration: 1000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
              }
            }
          } else if (this.onboardingStep === "complete") this.applyCompanionAppearance();
          else if (this.onboardingStep !== "mirror") {
            this.pet.setPosition(430, 645).setAlpha(0.82).setScale(CROW_SPRITE_SCALE);
            this.footprints.setVisible(false);
            this.threateningShadow.setVisible(false).setAlpha(0);
          }
          if (roomCue) this.refreshRoomCueProximity(true);
          else this.refreshIntroductionProximity(true);
        }

        private applyCompanionAppearance() {
          this.threateningShadow.setVisible(false).setAlpha(0);
          this.pet.setPosition(430, 650).setScale(CROW_SPRITE_SCALE).setAlpha(0.9);
          this.footprints.setVisible(false);
          this.crowInteractionReady = true;
          this.syncCrowInteractionRing();
        }

        private startMirrorReveal() {
          this.tweens.killTweensOf([this.pet, this.threateningShadow]);
          this.mirrorReady = this.reducedMotion;
          if (this.reducedMotion) {
            this.pet.setPosition(430, 645).setScale(CROW_SPRITE_SCALE).setAlpha(0.82);
            this.threateningShadow.setVisible(false);
            return;
          }
          this.threateningShadow.setVisible(true).setAlpha(0);
          this.pet.setPosition(1260, 510).setScale(CROW_SPRITE_SCALE).setAlpha(0.9);
          this.tweens.add({ targets: this.threateningShadow, alpha: 0.5, duration: 320, yoyo: true, hold: 340, onComplete: () => this.threateningShadow.setVisible(false) });
          this.tweens.add({
            targets: this.pet,
            x: 430,
            y: 645,
            duration: 1550,
            delay: 280,
            ease: "Sine.easeInOut",
            onComplete: () => {
              this.mirrorReady = true;
              this.footprints.setPosition(455, 690).setAlpha(0.45).setVisible(true);
              this.refreshIntroductionProximity(true);
            },
          });
        }

        private startNetSequence() {
          this.caughtCount = 0;
          this.clearFlock();
          this.spawnCrossing();
          this.dispatchFeedback("Sweep when a crossing comes near. There is no score, and missed shapes return.");
        }

        private makeBird(x: number, y: number, scale = 1) {
          const bird = this.add.container(x, y).setDepth(7).setScale(scale);
          const glow = this.add.circle(0, 0, 24, 0xc9bcff, 0.18);
          const body = this.add.ellipse(0, 0, 30, 13, 0xe9e2ff, 0.92).setStrokeStyle(2, 0x75688f, 0.65);
          const left = this.add.ellipse(-15, -6, 25, 9, 0xf9e6bc, 0.76).setRotation(-0.35);
          const right = this.add.ellipse(15, -6, 25, 9, 0xf9e6bc, 0.76).setRotation(0.35);
          bird.add([glow, left, right, body]);
          if (!this.reducedMotion) this.tweens.add({ targets: [left, right], scaleY: 0.28, duration: 130, yoyo: true, repeat: -1 });
          return bird;
        }

        private spawnCrossing() {
          const stage = this.caughtCount;
          const y = [600, 710, 535][stage] ?? 600;
          this.currentBird = this.makeBird(1330, y, stage === 2 ? 0.82 : 1);
          this.flock.push(this.currentBird);
          if (stage === 2) {
            const followerA = this.makeBird(1390, y + 48, 0.65);
            const followerB = this.makeBird(1270, y - 42, 0.58);
            this.flock.push(followerA, followerB);
            this.tweens.add({ targets: followerA, x: 190, y: 665, duration: 6000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
            this.tweens.add({ targets: followerB, x: 250, y: 505, duration: 5600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
          }
          this.tweens.add({ targets: this.currentBird, x: 210, y: stage === 1 ? 570 : y - 20, duration: [7200, 6000, 5200][stage], yoyo: true, repeat: -1, ease: stage === 1 ? "Sine.easeInOut" : "Linear" });
          this.birdStartedAt = this.time.now;
          this.refreshIntroductionProximity(true);
        }

        private sweepNet() {
          if (!this.currentBird || this.panelOpen) return;
          this.net.setPosition(this.hero.x + (this.heroFacing === "left" ? -42 : 42), this.hero.y - 28).setFlipX(this.heroFacing === "left").setVisible(true).play("intro-net-sweep", true).setScale(0.34);
          const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.currentBird.x, this.currentBird.y);
          const catchRadius = this.coarsePointer ? 330 : 235;
          const assistDelay = this.coarsePointer ? 3200 : 6500;
          const assisted = this.time.now - this.birdStartedAt > assistDelay;
          window.dispatchEvent(new CustomEvent("life-room:onboarding-action", { detail: { action: "sweep" } }));
          if (distance > catchRadius && !assisted) {
            this.dispatchFeedback(this.coarsePointer
              ? "The crossing curves away. Move closer, then tap the prompt again. It will slow down if you need it."
              : "The light slips past, curves around, and comes back. Move closer and sweep again.");
            return;
          }
          const caught = this.currentBird;
          this.currentBird = null;
          this.tweens.killTweensOf(caught);
          this.tweens.add({ targets: caught, x: 1320, y: 380, alpha: 0, duration: this.reducedMotion ? 1 : 650, ease: "Sine.easeIn", onComplete: () => caught.destroy(true) });
          this.caughtCount += 1;
          this.dispatchFeedback(this.caughtCount < 3 ? `${this.caughtCount} crossing${this.caughtCount === 1 ? "" : "s"} held. The next one is already turning back.` : "The net grows weightless. Everything caught is rising again.");
          this.refreshIntroductionProximity(true);
          if (this.caughtCount < 3) this.time.delayedCall(this.reducedMotion ? 10 : 520, () => this.spawnCrossing());
          else this.finishNetSequence();
        }

        private finishNetSequence() {
          for (let index = 0; index < 5; index += 1) {
            const release = this.makeBird(this.hero.x + (index - 2) * 26, this.hero.y - 45, 0.55 + index * 0.05);
            this.tweens.add({ targets: release, x: 1280 + index * 20, y: 330 + index * 22, alpha: 0, duration: this.reducedMotion ? 1 : 850 + index * 80, delay: index * 50, onComplete: () => release.destroy(true) });
          }
          this.time.delayedCall(this.reducedMotion ? 20 : 1150, () => {
            this.net.setVisible(false);
            window.dispatchEvent(new CustomEvent("life-room:onboarding-action", { detail: { action: "net-complete" } }));
          });
        }

        private clearFlock() {
          for (const bird of this.flock) {
            if (bird.active) {
              this.tweens.killTweensOf(bird);
              bird.destroy(true);
            }
          }
          this.flock = [];
          this.currentBird = null;
        }

        private dispatchFeedback(message: string) {
          window.dispatchEvent(new CustomEvent("life-room:onboarding-feedback", { detail: { message } }));
        }

        private getCurrentIntroductionHotspot() {
          if (this.onboardingStep === "envelope") return INTRODUCTION_HOTSPOTS.envelope;
          if (this.onboardingStep === "window") return INTRODUCTION_HOTSPOTS.window;
          if (this.onboardingStep === "mirror" && this.mirrorReady) return INTRODUCTION_HOTSPOTS.mirror;
          return null;
        }

        private performIntroductionAction(action: IntroAction) {
          if (action === "sweep") {
            this.sweepNet();
            return;
          }
          this.destination = null;
          if (action === "mirror") {
            this.mirrorReady = false;
            this.introNearest = null;
            this.introPrompt = "";
            window.dispatchEvent(new CustomEvent("life-room:onboarding-proximity", { detail: null }));
          }
          window.dispatchEvent(new CustomEvent("life-room:onboarding-action", { detail: { action } }));
        }

        private refreshIntroductionProximity(force = false) {
          let next: IntroductionHotspot | null = null;
          let prompt = "";
          if (this.onboardingStep === "net") {
            prompt = `Sweep net · ${this.caughtCount}/3 held`;
          } else {
            const hotspot = this.getCurrentIntroductionHotspot();
            if (hotspot && Phaser.Math.Distance.Between(this.hero.x, this.hero.y, hotspot.x, hotspot.y) < hotspot.radius) {
              next = hotspot;
              prompt = hotspot.label;
            }
          }
          if (!force && next?.action === this.introNearest?.action && prompt === this.introPrompt) return;
          this.introNearest = next;
          this.introPrompt = prompt;
          window.dispatchEvent(new CustomEvent("life-room:onboarding-proximity", { detail: prompt ? { action: this.onboardingStep === "net" ? "sweep" : next?.action, label: prompt } : null }));
        }

        private applyVisualState(state: RoomVisualState, animate: boolean) {
          if (!this.memoryGlow) return;
          const preset = getMoodPreset(state.atmosphere.mood);
          const duration = animate && !this.reducedMotion ? 900 : 0;
          this.memoryGlow.frequency = Math.max(280, 920 - state.memoryLevel * 45);
          const oldTint = this.background.tintTopLeft;
          const oldAmbient = this.ambient.fillColor;
          const oldWindow = this.windowLight.tintTopLeft;
          this.tweens.killTweensOf([this.ambient, this.windowLight, this.lampLight]);
          this.tweens.killTweensOf(this.lightTransition);
          this.lightTransition.value = 0;
          const applyColors = (value: number) => {
            const blend = (from: number, to: number) => {
              const a = Phaser.Display.Color.ValueToColor(from);
              const b = Phaser.Display.Color.ValueToColor(to);
              const color = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, value * 100);
              return Phaser.Display.Color.GetColor(color.r, color.g, color.b);
            };
            const roomTint = blend(oldTint, preset.tint);
            this.background.setTint(roomTint);
            this.ambient.setFillStyle(blend(oldAmbient, preset.ambientColor));
            this.windowLight.setTint(blend(oldWindow, preset.windowColor));
          };
          if (duration) {
            this.tweens.add({ targets: this.lightTransition, value: 1, duration, ease: "Sine.easeInOut", onUpdate: () => applyColors(this.lightTransition.value) });
            this.tweens.add({ targets: this.ambient, alpha: preset.ambientAlpha, duration });
            this.tweens.add({ targets: this.windowLight, alpha: preset.windowAlpha, duration });
            this.tweens.add({ targets: this.lampLight, alpha: preset.lampAlpha, duration });
          } else {
            applyColors(1);
            this.ambient.setAlpha(preset.ambientAlpha);
            this.windowLight.setAlpha(preset.windowAlpha);
            this.lampLight.setAlpha(preset.lampAlpha);
          }
          if (animate && state.atmosphere.revision > this.lastRevision) {
            this.tweens.killTweensOf(this.saveHalo);
            if (!this.reducedMotion) {
              this.saveHalo.setAlpha(0.65);
              this.tweens.add({ targets: this.saveHalo, alpha: 0, duration: 1600, ease: "Sine.easeOut" });
              this.memoryGlow.emitParticle(14);
            }
          }
          this.lastRevision = state.atmosphere.revision;
        }

        private createHero(x: number, y: number) {
          for (const gender of ["female", "male"] as const) {
            const texture = this.textures.get(`hero-${gender}`);
            for (const [row, facing] of ["front", "back", "left", "right"].entries()) {
              for (let column = 0; column < 4; column += 1) {
                texture.add(`${facing}-${column}`, 0,
                  column * HERO_FRAME_SIZE, row * HERO_FRAME_SIZE,
                  HERO_FRAME_SIZE, HERO_FRAME_SIZE);
              }
            }
          }
          const container = this.add.container(x, y);
          const shadow = this.add.ellipse(0, 2, 58, 18, 0x3d2940, 0.24);
          this.heroSprite = this.add.image(0, -78, `hero-${this.currentGender}`, "front-0");
          this.heroSprite.setScale(HERO_DISPLAY_HEIGHT / this.heroSprite.height);
          container.add([shadow, this.heroSprite]);
          return container;
        }

        private openPanel(hotspot: Hotspot) {
          if (getPanelAccess(this.onboardingStep, hotspot.id) === "locked") return;
          this.destination = null;
          this.setPaused(true);
          window.dispatchEvent(new CustomEvent("life-room:open", { detail: { panel: hotspot.id, label: hotspot.label } }));
        }

        private openRoomNote(note?: FinalNote) {
          this.destination = null;
          window.dispatchEvent(new CustomEvent("life-room:room-note", { detail: { note } }));
        }

        private layoutCamera() {
          const viewportWidth = Math.max(1, this.scale.width);
          const viewportHeight = Math.max(1, this.scale.height);
          this.baseCameraZoom = Math.min(viewportWidth / ROOM_WORLD_WIDTH, viewportHeight / ROOM_WORLD_HEIGHT);
          const verticalFillZoom = viewportHeight / (ROOM_WORLD_HEIGHT * this.baseCameraZoom);
          this.maxRoomZoom = Phaser.Math.Clamp(verticalFillZoom * CAMERA_OVERSCAN_AFTER_VERTICAL_FILL, 1.8, MAX_ROOM_ZOOM);
          this.roomZoom = Phaser.Math.Clamp(this.roomZoom, 1, this.maxRoomZoom);
          this.cameras.main.setViewport(0, 0, viewportWidth, viewportHeight);
          this.cameras.main.setZoom(this.baseCameraZoom * this.roomZoom);
          this.clampCameraCenter();
        }

        private clampCameraCenter() {
          const camera = this.cameras.main;
          const halfViewWidth = camera.width / (2 * camera.zoom);
          const halfViewHeight = camera.height / (2 * camera.zoom);
          this.cameraCenter.x = halfViewWidth >= ROOM_WORLD_WIDTH / 2
            ? ROOM_WORLD_WIDTH / 2
            : Phaser.Math.Clamp(this.cameraCenter.x, halfViewWidth, ROOM_WORLD_WIDTH - halfViewWidth);
          this.cameraCenter.y = halfViewHeight >= ROOM_WORLD_HEIGHT / 2
            ? ROOM_WORLD_HEIGHT / 2
            : Phaser.Math.Clamp(this.cameraCenter.y, halfViewHeight, ROOM_WORLD_HEIGHT - halfViewHeight);
          camera.centerOn(this.cameraCenter.x, this.cameraCenter.y);
        }

        private startPointerGesture(pointer: Phaser.Input.Pointer) {
          if (this.panelOpen) return;
          const pointersDown = this.input.manager.pointers.filter((item) => item.isDown).length;
          if (pointersDown > 1) {
            this.destination = null;
            this.panPointerId = null;
            this.cameraDragging = false;
            this.gestureHadPinch = true;
            return;
          }
          this.panPointerId = pointer.id;
          this.panStart = { x: pointer.x, y: pointer.y };
          this.panLast = { x: pointer.x, y: pointer.y };
          this.cameraDragging = false;
          this.gestureHadPinch = false;
        }

        private movePointerGesture(pointer: Phaser.Input.Pointer) {
          if (this.panelOpen || this.panPointerId !== pointer.id) return;
          if (this.input.manager.pointers.filter((item) => item.isDown).length > 1) return;
          const travelled = Phaser.Math.Distance.Between(this.panStart.x, this.panStart.y, pointer.x, pointer.y);
          if (!this.cameraDragging && travelled >= CAMERA_PAN_THRESHOLD) {
            this.cameraDragging = true;
            this.destination = null;
          }
          if (!this.cameraDragging || this.roomZoom <= 1.001) return;
          const camera = this.cameras.main;
          this.cameraCenter.x -= (pointer.x - this.panLast.x) / camera.zoom;
          this.cameraCenter.y -= (pointer.y - this.panLast.y) / camera.zoom;
          this.panLast = { x: pointer.x, y: pointer.y };
          this.clampCameraCenter();
        }

        private finishPointerGesture(pointer: Phaser.Input.Pointer) {
          const remainingPointer = this.input.manager.pointers.find((item) => item.isDown && item.id !== pointer.id);
          if (this.gestureHadPinch && remainingPointer) {
            this.pinchStartDistance = 0;
            this.panPointerId = remainingPointer.id;
            this.panStart = { x: remainingPointer.x, y: remainingPointer.y };
            this.panLast = { x: remainingPointer.x, y: remainingPointer.y };
            this.cameraDragging = true;
            return;
          }
          const matchesPanPointer = this.panPointerId === pointer.id;
          const shouldTap = matchesPanPointer && !this.cameraDragging && !this.gestureHadPinch && !this.panelOpen;
          this.panPointerId = null;
          this.cameraDragging = false;
          if (shouldTap) {
            const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.handleRoomTap(new Phaser.Math.Vector2(point.x, point.y));
          }
          if (!this.input.manager.pointers.some((item) => item.isDown)) {
            this.gestureHadPinch = false;
            this.pinchStartDistance = 0;
          }
        }

        private handleRoomTap(point: Phaser.Math.Vector2) {
          const roomCue = getRoomCue(this.onboardingStep);
          if (this.crowInteractionReady && getPanelAccess(this.onboardingStep, "guide") !== "locked" && this.pet.visible && Math.abs(point.x - this.pet.x) < 70 && Math.abs(point.y - this.pet.y) < 75) {
            this.openPanel(HOTSPOTS.find((hotspot) => hotspot.id === "guide")!);
            return;
          }
          if (roomCue) {
            if (this.onboardingStep === "reveal") {
              for (const note of FINAL_NOTE_ORDER) {
                const paper = this.finalPapers[note];
                if (Phaser.Math.Distance.Between(point.x, point.y, paper.x, paper.y) < 65) {
                  this.openRoomNote(note);
                  return;
                }
              }
            } else if (this.instructionPaper.visible && Phaser.Math.Distance.Between(point.x, point.y, this.instructionPaper.x, this.instructionPaper.y) < 50) {
              this.openRoomNote();
              return;
            }
            const direct = HOTSPOTS.find((hotspot) => getPanelAccess(this.onboardingStep, hotspot.id) !== "locked" && this.insideFurnitureHotspot(point.x, point.y, hotspot));
            if (direct) {
              this.openPanel(direct);
              return;
            }
            this.setWalkDestination(point);
            return;
          }
          if (this.onboardingStep !== "complete") {
            if (this.onboardingStep === "net") {
              this.setWalkDestination(point);
              return;
            }
            const introSpot = this.getCurrentIntroductionHotspot();
            if (introSpot && Phaser.Math.Distance.Between(
              point.x, point.y, introSpot.clickX ?? introSpot.x, introSpot.clickY ?? introSpot.y,
            ) < (introSpot.clickRadius ?? introSpot.radius)) {
              this.performIntroductionAction(introSpot.action);
              return;
            }
            this.setWalkDestination(point);
            return;
          }
          const direct = HOTSPOTS.find((hotspot) => this.insideFurnitureHotspot(point.x, point.y, hotspot));
          if (direct) {
            this.openPanel(direct);
            return;
          }
          this.setWalkDestination(point);
        }

        private performCurrentInteraction() {
          if (this.panelOpen) return;
          const roomCue = getRoomCue(this.onboardingStep);
          if (roomCue) {
            const nearbyPaper = this.getNearbyRoomPaper();
            if (nearbyPaper) {
              this.openRoomNote(nearbyPaper.note);
            } else if (this.nearest) {
              this.openPanel(this.nearest);
            }
            return;
          }
          if (this.onboardingStep === "net") {
            this.sweepNet();
            return;
          }
          if (this.onboardingStep !== "complete") {
            if (this.introNearest) this.performIntroductionAction(this.introNearest.action);
            return;
          }
          if (this.nearest) this.openPanel(this.nearest);
        }

        private setWalkDestination(point: Phaser.Math.Vector2) {
          this.destination = canStandAt(point.x, point.y) ? point : null;
        }

        private moveHeroBy(dx: number, dy: number): boolean {
          const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8));
          const stepX = dx / steps;
          const stepY = dy / steps;
          let moved = false;
          for (let index = 0; index < steps; index += 1) {
            const previousX = this.hero.x;
            const previousY = this.hero.y;
            if (canStandAt(previousX + stepX, previousY + stepY)) {
              this.hero.setPosition(previousX + stepX, previousY + stepY);
            } else {
              if (canStandAt(this.hero.x + stepX, this.hero.y)) this.hero.x += stepX;
              if (canStandAt(this.hero.x, this.hero.y + stepY)) this.hero.y += stepY;
            }
            moved ||= this.hero.x !== previousX || this.hero.y !== previousY;
          }
          return moved;
        }

        private updateHero(delta: number) {
          const speed = this.onboardingStep === "complete" ? ROOM_WALK_SPEED : INTRODUCTION_WALK_SPEED;
          const movement = new Phaser.Math.Vector2(this.virtualMove.x, this.virtualMove.y);
          if (this.keys.left.isDown || this.keys.arrowLeft.isDown) movement.x -= 1;
          if (this.keys.right.isDown || this.keys.arrowRight.isDown) movement.x += 1;
          if (this.keys.up.isDown || this.keys.arrowUp.isDown) movement.y -= 1;
          if (this.keys.down.isDown || this.keys.arrowDown.isDown) movement.y += 1;
          let moving = false;
          if (movement.lengthSq() > 0) {
            this.destination = null;
            movement.normalize().scale((speed * delta) / 1000);
            moving = this.moveHeroBy(movement.x, movement.y);
            this.heroFacing = Math.abs(movement.x) > Math.abs(movement.y)
              ? (movement.x < 0 ? "left" : "right") : (movement.y < 0 ? "back" : "front");
          } else if (this.destination) {
            const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.destination.x, this.destination.y);
            if (distance < 8) this.destination = null;
            else {
              const direction = new Phaser.Math.Vector2(this.destination.x - this.hero.x, this.destination.y - this.hero.y)
                .normalize().scale(Math.min(distance, (speed * delta) / 1000));
              moving = this.moveHeroBy(direction.x, direction.y);
              this.heroFacing = Math.abs(direction.x) > Math.abs(direction.y)
                ? (direction.x < 0 ? "left" : "right") : (direction.y < 0 ? "back" : "front");
              if (!moving || Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.destination.x, this.destination.y) < 8) {
                this.destination = null;
              }
            }
          }
          this.heroWalkElapsed = moving ? this.heroWalkElapsed + delta : 0;
          const frame = moving ? HERO_WALK_FRAMES[Math.floor(this.heroWalkElapsed / 125) % HERO_WALK_FRAMES.length] : 0;
          this.heroSprite.setFrame(`${this.heroFacing}-${frame}`);
          this.hero.rotation = moving && !this.reducedMotion ? Math.sin(this.time.now / 90) * 0.018 : 0;
          this.hero.setDepth(Math.round(this.hero.y + 10));
          if (this.onboardingStep === "net") this.net.setPosition(this.hero.x + (this.heroFacing === "left" ? -42 : 42), this.hero.y - 28).setDepth(this.hero.depth + 1).setFlipX(this.heroFacing === "left");
        }

        private updatePinchZoom(): boolean {
          const pointers = this.input.manager.pointers.filter((pointer) => pointer.isDown);
          if (pointers.length < 2) {
            this.pinchStartDistance = 0;
            return false;
          }
          const [first, second] = pointers;
          const distance = Phaser.Math.Distance.Between(first.x, first.y, second.x, second.y);
          const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
          if (!this.pinchStartDistance) {
            this.pinchStartDistance = Math.max(1, distance);
            this.pinchStartRoomZoom = this.roomZoom;
            const focus = this.cameras.main.getWorldPoint(midpoint.x, midpoint.y);
            this.pinchFocusWorld = { x: focus.x, y: focus.y };
            this.destination = null;
            this.virtualMove = { x: 0, y: 0 };
            this.panPointerId = null;
            this.cameraDragging = false;
            this.gestureHadPinch = true;
            return true;
          }
          this.roomZoom = Phaser.Math.Clamp(
            this.pinchStartRoomZoom * distance / this.pinchStartDistance,
            1,
            this.maxRoomZoom,
          );
          const camera = this.cameras.main;
          camera.setZoom(this.baseCameraZoom * this.roomZoom);
          this.cameraCenter.x = this.pinchFocusWorld.x - (midpoint.x - camera.width / 2) / camera.zoom;
          this.cameraCenter.y = this.pinchFocusWorld.y - (midpoint.y - camera.height / 2) / camera.zoom;
          if (this.roomZoom <= 1.001) {
            this.cameraCenter = { x: ROOM_WORLD_WIDTH / 2, y: ROOM_WORLD_HEIGHT / 2 };
          }
          this.clampCameraCenter();
          return true;
        }

        private insideFurnitureHotspot(x: number, y: number, hotspot: Hotspot) {
          if (hotspot.id === "guide" && !this.crowInteractionReady) return false;
          const centerX = hotspot.id === "guide" && this.pet.visible ? this.pet.x + CROW_INTERACTION_OFFSET_X : hotspot.x;
          const centerY = hotspot.id === "guide" && this.pet.visible ? this.pet.y : hotspot.y;
          return insideHotspot(x, y, hotspot, centerX, centerY);
        }

        private refreshFurnitureProximity() {
          let nearest: Hotspot | null = null;
          let nearestDistance = Number.POSITIVE_INFINITY;
          for (const hotspot of HOTSPOTS) {
            if (getPanelAccess(this.onboardingStep, hotspot.id) === "locked") continue;
            if (hotspot.id === "guide" && !this.crowInteractionReady) continue;
            const centerX = hotspot.id === "guide" && this.pet.visible ? this.pet.x + CROW_INTERACTION_OFFSET_X : hotspot.x;
            const centerY = hotspot.id === "guide" && this.pet.visible ? this.pet.y : hotspot.y;
            const relativeX = (this.hero.x - centerX) / hotspot.radiusX;
            const relativeY = (this.hero.y - centerY) / hotspot.radiusY;
            const distance = relativeX * relativeX + relativeY * relativeY;
            if (distance <= 1 && distance < nearestDistance) {
              nearest = hotspot;
              nearestDistance = distance;
            }
          }
          if (nearest?.id !== this.nearest?.id) {
            this.nearest = nearest;
            window.dispatchEvent(new CustomEvent("life-room:proximity", { detail: nearest ? { panel: nearest.id, label: nearest.label } : null }));
          }
        }

        private getNearbyRoomPaper() {
          const cue = getRoomCue(this.onboardingStep);
          if (!cue) return null;
          const candidates: Array<{ note: FinalNote | undefined; paper: Phaser.GameObjects.Container }> = this.onboardingStep === "reveal"
            ? FINAL_NOTE_ORDER.filter((note) => !this.finalNotesRead[note]).map((note) => ({ note, paper: this.finalPapers[note] }))
            : this.instructionPaper.visible ? [{ note: undefined, paper: this.instructionPaper }] : [];
          const nearest = candidates
            .map((candidate) => ({ ...candidate, distance: Phaser.Math.Distance.Between(this.hero.x, this.hero.y, candidate.paper.x, candidate.paper.y) }))
            .sort((a, b) => a.distance - b.distance)[0];
          return nearest && nearest.distance < PAPER_INTERACTION_RADIUS ? nearest : null;
        }

        private refreshRoomCueProximity(force = false) {
          const nearbyPaper = this.getNearbyRoomPaper();
          const prompt = nearbyPaper ? "Open the folded note" : "";
          if (!force && prompt === this.paperPrompt) return;
          this.paperPrompt = prompt;
          window.dispatchEvent(new CustomEvent("life-room:onboarding-proximity", { detail: prompt ? { action: "paper", label: prompt } : null }));
        }

        private syncCrowInteractionRing() {
          const guideRing = this.hotspotRings.find(({ id }) => id === "guide")?.ring;
          if (!guideRing) return;
          const visible = this.crowInteractionReady && this.pet.visible && getPanelAccess(this.onboardingStep, "guide") !== "locked";
          guideRing.setVisible(visible);
          if (visible) guideRing.setPosition(this.pet.x + CROW_INTERACTION_OFFSET_X, this.pet.y);
        }

        update(_time: number, delta: number) {
          if (!this.keys || this.panelOpen) return;
          if (this.updatePinchZoom()) return;
          this.updateHero(delta);
          this.syncCrowInteractionRing();
          const roomCue = getRoomCue(this.onboardingStep);
          if (roomCue) {
            this.refreshFurnitureProximity();
            this.refreshRoomCueProximity();
            if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.performCurrentInteraction();
            return;
          }
          if (this.onboardingStep !== "complete") {
            if (this.nearest) {
              this.nearest = null;
              window.dispatchEvent(new CustomEvent("life-room:proximity", { detail: null }));
            }
            this.refreshIntroductionProximity();
            if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.performCurrentInteraction();
            return;
          }
          if (this.introNearest || this.introPrompt) {
            this.introNearest = null;
            this.introPrompt = "";
            window.dispatchEvent(new CustomEvent("life-room:onboarding-proximity", { detail: null }));
          }
          this.refreshFurnitureProximity();
          if (Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.performCurrentInteraction();
        }
      }

      const host = hostRef.current;
      const initialWidth = Math.max(1, host.clientWidth || ROOM_WORLD_WIDTH);
      const initialHeight = Math.max(1, host.clientHeight || ROOM_WORLD_HEIGHT);
      const initialDensity = getRenderDensity(initialWidth, initialHeight);
      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width: Math.round(initialWidth * initialDensity),
        height: Math.round(initialHeight * initialDensity),
        backgroundColor: "#2f2841",
        scene: DreamRoomScene,
        transparent: false,
        render: { antialias: true, pixelArt: false, roundPixels: false },
        scale: { mode: Phaser.Scale.NONE, zoom: 1 / initialDensity, autoCenter: Phaser.Scale.CENTER_BOTH },
      });
      gameRef.current = game;

      const resizeRenderer = () => {
        if (cancelled || !hostRef.current) return;
        const cssWidth = Math.max(1, hostRef.current.clientWidth);
        const cssHeight = Math.max(1, hostRef.current.clientHeight);
        const density = getRenderDensity(cssWidth, cssHeight);
        const renderWidth = Math.round(cssWidth * density);
        const renderHeight = Math.round(cssHeight * density);
        const zoom = 1 / density;
        if (Math.abs(game.scale.zoom - zoom) > 0.001) game.scale.setZoom(zoom);
        if (game.scale.width !== renderWidth || game.scale.height !== renderHeight) {
          game.scale.resize(renderWidth, renderHeight);
        }
        game.canvas.style.width = `${cssWidth}px`;
        game.canvas.style.height = `${cssHeight}px`;
      };

      resizeObserver = new ResizeObserver(resizeRenderer);
      resizeObserver.observe(host);
      resizeRenderer();
    }

    void mountGame();
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div className="room-game" ref={hostRef} aria-label="Interactive diary room. Use WASD, Arrow Keys, the touch joystick, or tap to move. Pinch with two fingers to zoom, then drag the enlarged room within its boundaries. Use E or tap an object to interact." />;
}
