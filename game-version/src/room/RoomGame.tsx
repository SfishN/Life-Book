"use client";

import { useEffect, useRef } from "react";
import type { GuidanceMode, OnboardingStep } from "@/domain/onboarding";
import type { HeroProfile, PanelId, RoomAtmosphere } from "@/domain/types";
import { getWeatherPreset } from "@/domain/weather";
import ROOM_LAYERS from "./roomLayers.json";

interface RoomGameProps {
  paused: boolean;
  memoryLevel: number;
  diaryCount: number;
  atmosphere: RoomAtmosphere;
  onboardingStep: OnboardingStep;
  guidanceMode: GuidanceMode;
  heroGender: HeroProfile["gender"];
}

type RoomVisualState = Pick<RoomGameProps, "memoryLevel" | "diaryCount" | "atmosphere">;
const HERO_DISPLAY_HEIGHT = 160;
type IntroAction = "envelope" | "window" | "sweep" | "mirror";

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
  { id: "achievements", label: "Achievement Wall", x: 1160, y: 720, radiusX: 85, radiusY: 42, clickAreas: [[865, 180, 155, 175], [1000, 225, 150, 85], [1000, 325, 100, 80]] },
  { id: "diary", label: "Diary", x: 365, y: 645, radiusX: 75, radiusY: 38, clickAreas: [[225, 280, 170, 360]] },
  { id: "guide", label: "Mirror Guide", x: 505, y: 630, radiusX: 70, radiusY: 40, clickAreas: [[425, 310, 125, 290]] },
  { id: "skills", label: "Skill Tree", x: 430, y: 760, radiusX: 75, radiusY: 42, clickAreas: [[300, 620, 115, 145]] },
  { id: "hero", label: "Hero", x: 790, y: 645, radiusX: 100, radiusY: 48, clickAreas: [[545, 255, 500, 355]] },
  { id: "novel", label: "Life Novel", x: 710, y: 845, radiusX: 105, radiusY: 50, clickAreas: [[520, 675, 380, 225]] },
];

function insideHotspot(x: number, y: number, hotspot: Hotspot): boolean {
  return hotspot.clickAreas.some(([left, top, width, height]) =>
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

const INTRODUCTION_HOTSPOTS: Record<"envelope" | "window" | "mirror", IntroductionHotspot> = {
  envelope: { action: "envelope", label: "Open the glowing envelope", x: 1160, y: 665, radius: 180 },
  window: { action: "window", label: "Inspect the mark on the window", x: 1195, y: 705, radius: 130, clickX: 1200, clickY: 445, clickRadius: 165 },
  mirror: { action: "mirror", label: "Look behind the mirror", x: 520, y: 650, radius: 130, clickX: 490, clickY: 455, clickRadius: 150 },
};

export function RoomGame({ paused, memoryLevel, diaryCount, atmosphere, onboardingStep, guidanceMode, heroGender }: RoomGameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const visualRef = useRef<RoomVisualState>({ memoryLevel, diaryCount, atmosphere });
  const onboardingRef = useRef({ step: onboardingStep, guidanceMode });
  const heroGenderRef = useRef(heroGender);
  const gameRef = useRef<{ destroy: (removeCanvas: boolean, noReturn?: boolean) => void } | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    window.dispatchEvent(new CustomEvent("life-room:pause", { detail: { paused } }));
  }, [paused]);

  useEffect(() => {
    visualRef.current = { memoryLevel, diaryCount, atmosphere };
    window.dispatchEvent(new CustomEvent("life-room:memory", { detail: visualRef.current }));
  }, [memoryLevel, diaryCount, atmosphere]);

  useEffect(() => {
    onboardingRef.current = { step: onboardingStep, guidanceMode };
    window.dispatchEvent(new CustomEvent("life-room:onboarding", { detail: onboardingRef.current }));
  }, [guidanceMode, onboardingStep]);

  useEffect(() => {
    heroGenderRef.current = heroGender;
    window.dispatchEvent(new CustomEvent("life-room:hero-gender", { detail: heroGender }));
  }, [heroGender]);

  useEffect(() => {
    let cancelled = false;

    async function mountGame() {
      if (!hostRef.current || gameRef.current) return;
      const Phaser = (await import("phaser")).default;
      if (cancelled || !hostRef.current) return;

      class DreamRoomScene extends Phaser.Scene {
        private hero!: Phaser.GameObjects.Container;
        private heroSprite!: Phaser.GameObjects.Image;
        private heroFacing: "front" | "back" | "left" | "right" = "front";
        private currentGender: HeroProfile["gender"] = "female";
        private keys!: Record<"up" | "down" | "left" | "right" | "interact", Phaser.Input.Keyboard.Key>;
        private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
        private destination: Phaser.Math.Vector2 | null = null;
        private nearest: Hotspot | null = null;
        private introNearest: IntroductionHotspot | null = null;
        private introPrompt = "";
        private panelOpen = false;
        private pauseFrame = 0;
        private memoryGlow!: Phaser.GameObjects.Particles.ParticleEmitter;
        private background!: Phaser.GameObjects.Image;
        private roomLayers: Phaser.GameObjects.Image[] = [];
        private ambient!: Phaser.GameObjects.Rectangle;
        private windowLight!: Phaser.GameObjects.Image;
        private lampLight!: Phaser.GameObjects.Image;
        private saveHalo!: Phaser.GameObjects.Image;
        private memoryBooks!: Phaser.GameObjects.Graphics;
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
        private lastRevision = 0;
        private onboardingStep: OnboardingStep = "arrival";
        private guidanceMode: GuidanceMode = "nudge";
        private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        private lightTransition = { value: 0 };

        private onHeroGender = (event: Event) => {
          const gender = (event as CustomEvent<HeroProfile["gender"]>).detail;
          this.currentGender = gender === "male" ? "male" : "female";
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
          const detail = (event as CustomEvent<{ step: OnboardingStep; guidanceMode: GuidanceMode }>).detail;
          this.onboardingStep = detail.step;
          this.guidanceMode = detail.guidanceMode;
          this.applyOnboardingState();
        };
        private onOnboardingCommand = (event: Event) => {
          const action = (event as CustomEvent<{ action: IntroAction }>).detail.action;
          if (action === "sweep" && this.onboardingStep === "net") this.sweepNet();
          else if (this.introNearest?.action === action) this.performIntroductionAction(action);
        };

        constructor() {
          super("dream-room");
        }

        preload() {
          for (const layer of ROOM_LAYERS) {
            this.load.image(layer.id, `/room/layers/${layer.file}`);
          }
          this.load.image("hero-female", "/characters/girl.png");
          this.load.image("hero-male", "/characters/boy.png");
          this.load.spritesheet("intro-envelope", "/onboarding/objects/envelope-3f.png", { frameWidth: 724, frameHeight: 724 });
          this.load.spritesheet("intro-net", "/onboarding/objects/net-sweep-8f.png", { frameWidth: 443, frameHeight: 443, endFrame: 7 });
          this.load.spritesheet("intro-pet", "/onboarding/pet/pet-flutter-8f.png", { frameWidth: 384, frameHeight: 512, endFrame: 7 });
          this.load.image("intro-leaf", "/onboarding/notes/leaf-note.png");
          this.load.image("intro-footprints", "/onboarding/pet/pet-footprint-8.png");
          this.load.image("intro-shadow", "/onboarding/pet/pet-threatening-shadow.png");
        }

        create() {
          this.roomLayers = ROOM_LAYERS.map((layer, index) => {
            const [x, y] = layer.target;
            return this.add.image(x, y, layer.id).setOrigin(0, 0).setDepth(index / 100);
          });
          this.background = this.roomLayers[0];

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
          this.memoryBooks = this.add.graphics().setDepth(4);
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
            this.add.ellipse(hotspot.x, hotspot.y, hotspot.radiusX * 2, hotspot.radiusY * 2)
              .setStrokeStyle(3, 0xffe7aa, 0.13)
              .setFillStyle(0xffe7aa, 0.015)
              .setDepth(2);
          }

          this.windowMark = this.createWindowMark();
          this.threateningShadow = this.add.image(768, 512, "intro-shadow").setDisplaySize(1536, 1024).setDepth(5).setAlpha(0).setVisible(false);
          this.footprints = this.add.image(350, 670, "intro-footprints").setDisplaySize(430, 215).setDepth(6).setAlpha(0.52).setVisible(false);
          this.leafNote = this.add.image(1200, 445, "intro-leaf").setDisplaySize(190, 190).setDepth(7).setVisible(false);
          this.envelope = this.add.sprite(1160, 655, "intro-envelope", 0).setDisplaySize(185, 185).setDepth(7).setVisible(false);
          this.net = this.add.sprite(0, 0, "intro-net", 0).setDisplaySize(150, 150).setDepth(9).setVisible(false);
          this.pet = this.add.sprite(430, 645, "intro-pet", 0).setDisplaySize(138, 184).setDepth(8).setVisible(false);

          if (!this.anims.exists("intro-net-sweep")) {
            this.anims.create({ key: "intro-net-sweep", frames: this.anims.generateFrameNumbers("intro-net", { start: 0, end: 7 }), frameRate: 16, repeat: 0 });
          }
          if (!this.anims.exists("intro-pet-flutter")) {
            this.anims.create({ key: "intro-pet-flutter", frames: this.anims.generateFrameNumbers("intro-pet", { start: 0, end: 7 }), frameRate: 9, repeat: -1 });
          }

          this.currentGender = heroGenderRef.current;
          this.hero = this.createHero(745, 780).setDepth(8);
          const keyboard = this.input.keyboard;
          if (keyboard) {
            this.keys = {
              up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W, false),
              down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S, false),
              left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A, false),
              right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D, false),
              interact: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E, false),
            };
            this.cursors = keyboard.createCursorKeys();
          }

          this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (this.panelOpen) return;
            const point = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
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
            const direct = HOTSPOTS.find((hotspot) => insideHotspot(point.x, point.y, hotspot));
            if (direct) {
              this.openPanel(direct);
              return;
            }
            this.setWalkDestination(point);
          });

          window.addEventListener("life-room:hero-gender", this.onHeroGender);
          window.addEventListener("life-room:pause", this.onPause);
          window.addEventListener("life-room:memory", this.onMemory);
          window.addEventListener("life-room:onboarding", this.onOnboarding);
          window.addEventListener("life-room:onboarding-command", this.onOnboardingCommand);
          this.applyVisualState(visualRef.current, false);
          this.onboardingStep = onboardingRef.current.step;
          this.guidanceMode = onboardingRef.current.guidanceMode;
          this.applyOnboardingState();
          this.pauseFrame = window.requestAnimationFrame(() => this.setPaused(pausedRef.current));
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.cancelAnimationFrame(this.pauseFrame);
            window.removeEventListener("life-room:hero-gender", this.onHeroGender);
            window.removeEventListener("life-room:pause", this.onPause);
            window.removeEventListener("life-room:memory", this.onMemory);
            window.removeEventListener("life-room:onboarding", this.onOnboarding);
            window.removeEventListener("life-room:onboarding-command", this.onOnboardingCommand);
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
          this.input.keyboard?.resetKeys();
        }

        private applyOnboardingState() {
          if (!this.envelope) return;
          this.tweens.killTweensOf([this.envelope, this.windowMark, this.leafNote, this.footprints]);
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

          const petShouldStay = ["mirror", "diary", "index", "complete"].includes(this.onboardingStep);
          this.pet.setVisible(petShouldStay);
          if (petShouldStay && !this.reducedMotion) this.pet.play("intro-pet-flutter", true);
          else this.pet.stop().setFrame(0);
          this.pet.setScale(0.28);

          if (this.onboardingStep === "mirror") this.startMirrorReveal();
          else this.mirrorReady = false;

          if (this.onboardingStep === "complete") this.applyGuidanceAppearance();
          else if (this.onboardingStep !== "mirror") {
            this.pet.setPosition(430, 645).setAlpha(0.82).setScale(0.28);
            this.footprints.setVisible(false);
            this.threateningShadow.setVisible(false).setAlpha(0);
          }
          this.refreshIntroductionProximity(true);
        }

        private applyGuidanceAppearance() {
          this.threateningShadow.setVisible(false).setAlpha(0);
          if (this.guidanceMode === "quiet") {
            this.pet.setPosition(430, 650).setScale(0.28).setAlpha(0.45);
            this.footprints.setVisible(false);
          } else if (this.guidanceMode === "nudge") {
            this.pet.setPosition(355, 670).setScale(0.28).setAlpha(0.72);
            this.footprints.setPosition(315, 675).setAlpha(0.32).setVisible(true);
          } else {
            this.pet.setPosition(260, 675).setScale(0.28).setAlpha(0.94);
            this.footprints.setPosition(255, 690).setAlpha(0.58).setVisible(true);
          }
        }

        private startMirrorReveal() {
          this.tweens.killTweensOf([this.pet, this.threateningShadow]);
          this.mirrorReady = this.reducedMotion;
          if (this.reducedMotion) {
            this.pet.setPosition(430, 645).setScale(0.28).setAlpha(0.82);
            this.threateningShadow.setVisible(false);
            return;
          }
          this.threateningShadow.setVisible(true).setAlpha(0);
          this.pet.setPosition(1260, 510).setScale(0.28).setAlpha(0.9);
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
          const assisted = this.time.now - this.birdStartedAt > 6500;
          window.dispatchEvent(new CustomEvent("life-room:onboarding-action", { detail: { action: "sweep" } }));
          if (distance > 235 && !assisted) {
            this.dispatchFeedback("The light slips past, curves around, and comes back. Move closer and sweep again.");
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
          const preset = getWeatherPreset(state.atmosphere.weather);
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
            for (const layer of this.roomLayers) layer.setTint(roomTint);
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
          this.memoryBooks.clear();
          const colors = [0xd99799, 0x9bb5a0, 0xe3b56f, 0xb7a5cd, 0x9fbfd4];
          for (let index = 0; index < Math.min(state.diaryCount, 12); index += 1) {
            const x = 255 + index * 9;
            const y = 390 - (index % 3) * 3;
            this.memoryBooks.fillStyle(colors[index % colors.length], 1);
            this.memoryBooks.fillRoundedRect(x, y, 7, 30 + (index % 3) * 3, 2);
            this.memoryBooks.lineStyle(1, 0xfff1d7, 0.8);
            this.memoryBooks.lineBetween(x + 1, y + 7, x + 5, y + 7);
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
            const source = texture.getSourceImage();
            const cellWidth = source.width / 4;
            const cellHeight = source.height / 4;
            for (const [row, facing] of ["front", "back", "left", "right"].entries()) {
              for (let column = 0; column < 4; column += 1) {
                texture.add(`${facing}-${column}`, 0,
                  Math.round(column * cellWidth + 8), Math.round(row * cellHeight + 4),
                  Math.floor(cellWidth - 16), Math.floor(cellHeight - 8));
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
          this.destination = null;
          this.setPaused(true);
          window.dispatchEvent(new CustomEvent("life-room:open", { detail: { panel: hotspot.id, label: hotspot.label } }));
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
          const speed = 270;
          const movement = new Phaser.Math.Vector2(0, 0);
          if (this.keys.left.isDown || this.cursors.left.isDown) movement.x -= 1;
          if (this.keys.right.isDown || this.cursors.right.isDown) movement.x += 1;
          if (this.keys.up.isDown || this.cursors.up.isDown) movement.y -= 1;
          if (this.keys.down.isDown || this.cursors.down.isDown) movement.y += 1;
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
          this.heroSprite.setFrame(`${this.heroFacing}-${moving ? Math.floor(this.time.now / 140) % 4 : 0}`);
          this.hero.rotation = moving && !this.reducedMotion ? Math.sin(this.time.now / 90) * 0.018 : 0;
          this.hero.setDepth(Math.round(this.hero.y + 10));
          if (this.onboardingStep === "net") this.net.setPosition(this.hero.x + (this.heroFacing === "left" ? -42 : 42), this.hero.y - 28).setDepth(this.hero.depth + 1).setFlipX(this.heroFacing === "left");
        }

        private refreshFurnitureProximity() {
          let nearest: Hotspot | null = null;
          let nearestDistance = Number.POSITIVE_INFINITY;
          for (const hotspot of HOTSPOTS) {
            const relativeX = (this.hero.x - hotspot.x) / hotspot.radiusX;
            const relativeY = (this.hero.y - hotspot.y) / hotspot.radiusY;
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

        update(_time: number, delta: number) {
          if (!this.keys || !this.cursors || this.panelOpen) return;
          this.updateHero(delta);
          if (this.onboardingStep !== "complete") {
            if (this.nearest) {
              this.nearest = null;
              window.dispatchEvent(new CustomEvent("life-room:proximity", { detail: null }));
            }
            this.refreshIntroductionProximity();
            if (this.onboardingStep === "net" && Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.sweepNet();
            else if (this.introNearest && Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.performIntroductionAction(this.introNearest.action);
            return;
          }
          if (this.introNearest || this.introPrompt) {
            this.introNearest = null;
            this.introPrompt = "";
            window.dispatchEvent(new CustomEvent("life-room:onboarding-proximity", { detail: null }));
          }
          this.refreshFurnitureProximity();
          if (this.nearest && Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.openPanel(this.nearest);
        }
      }

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostRef.current,
        width: 1536,
        height: 1024,
        backgroundColor: "#2f2841",
        scene: DreamRoomScene,
        transparent: false,
        render: { antialias: true, pixelArt: false, roundPixels: false },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1536, height: 1024 },
      });
    }

    void mountGame();
    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div className="room-game" ref={hostRef} aria-label="Interactive diary room. Use WASD or Arrow Keys to move, E to interact, or the Room Index for direct furniture access." />;
}
