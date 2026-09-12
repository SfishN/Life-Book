"use client";

import { useEffect, useRef } from "react";
import type { GuidanceMode, OnboardingStep } from "@/domain/onboarding";
import type { PanelId, RoomAtmosphere } from "@/domain/types";
import { getWeatherPreset } from "@/domain/weather";

interface RoomGameProps {
  paused: boolean;
  memoryLevel: number;
  diaryCount: number;
  atmosphere: RoomAtmosphere;
  onboardingStep: OnboardingStep;
  guidanceMode: GuidanceMode;
}

type RoomVisualState = Pick<RoomGameProps, "memoryLevel" | "diaryCount" | "atmosphere">;
type IntroAction = "envelope" | "window" | "sweep" | "mirror";

interface Hotspot {
  id: PanelId;
  label: string;
  x: number;
  y: number;
  radius: number;
}

interface IntroductionHotspot {
  action: Exclude<IntroAction, "sweep">;
  label: string;
  x: number;
  y: number;
  radius: number;
}

const HOTSPOTS: Hotspot[] = [
  { id: "diary", label: "Diary", x: 220, y: 590, radius: 155 },
  { id: "guide", label: "Mirror Guide", x: 410, y: 535, radius: 155 },
  { id: "hero", label: "Hero", x: 770, y: 555, radius: 180 },
  { id: "achievements", label: "Achievement Wall", x: 1170, y: 370, radius: 170 },
  { id: "skills", label: "Skill Tree", x: 115, y: 700, radius: 160 },
  { id: "novel", label: "Life Novel", x: 735, y: 795, radius: 145 },
];

const INTRODUCTION_HOTSPOTS: Record<"envelope" | "window" | "mirror", IntroductionHotspot> = {
  envelope: { action: "envelope", label: "Open the glowing envelope", x: 1160, y: 665, radius: 180 },
  window: { action: "window", label: "Inspect the mark on the window", x: 1320, y: 520, radius: 210 },
  mirror: { action: "mirror", label: "Look behind the mirror", x: 410, y: 555, radius: 180 },
};

export function RoomGame({ paused, memoryLevel, diaryCount, atmosphere, onboardingStep, guidanceMode }: RoomGameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const visualRef = useRef<RoomVisualState>({ memoryLevel, diaryCount, atmosphere });
  const onboardingRef = useRef({ step: onboardingStep, guidanceMode });
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
    let cancelled = false;

    async function mountGame() {
      if (!hostRef.current || gameRef.current) return;
      const Phaser = (await import("phaser")).default;
      if (cancelled || !hostRef.current) return;

      class DreamRoomScene extends Phaser.Scene {
        private hero!: Phaser.GameObjects.Container;
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
          this.load.image("dream-room", "/room/dream-room.png");
          this.load.spritesheet("intro-envelope", "/onboarding/objects/envelope-3f.png", { frameWidth: 724, frameHeight: 724 });
          this.load.spritesheet("intro-net", "/onboarding/objects/net-sweep-8f.png", { frameWidth: 443, frameHeight: 443, endFrame: 7 });
          this.load.spritesheet("intro-pet", "/onboarding/pet/pet-flutter-8f.png", { frameWidth: 384, frameHeight: 512, endFrame: 7 });
          this.load.image("intro-leaf", "/onboarding/notes/leaf-note.png");
          this.load.image("intro-footprints", "/onboarding/pet/pet-footprint-8.png");
          this.load.image("intro-shadow", "/onboarding/pet/pet-threatening-shadow.png");
        }

        create() {
          this.background = this.add.image(768, 512, "dream-room");
          this.background.setDisplaySize(1536, 1024);

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
          this.windowLight = this.add.image(1250, 520, "memory-speck").setDisplaySize(820, 900).setDepth(2).setBlendMode(Phaser.BlendModes.ADD);
          this.lampLight = this.add.image(1060, 520, "memory-speck").setDisplaySize(360, 330).setTint(0xffc575).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
          this.saveHalo = this.add.image(215, 465, "memory-speck").setDisplaySize(430, 490).setTint(0xffe3a1).setAlpha(0).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
          this.memoryBooks = this.add.graphics().setDepth(4);
          this.memoryGlow = this.add.particles(220, 455, "memory-speck", {
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
            this.add.ellipse(hotspot.x, hotspot.y, hotspot.radius * 1.1, hotspot.radius * 0.48)
              .setStrokeStyle(3, 0xffe7aa, 0.13)
              .setFillStyle(0xffe7aa, 0.015)
              .setDepth(2);
          }

          this.windowMark = this.createWindowMark();
          this.threateningShadow = this.add.image(768, 512, "intro-shadow").setDisplaySize(1536, 1024).setDepth(5).setAlpha(0).setVisible(false);
          this.footprints = this.add.image(350, 670, "intro-footprints").setDisplaySize(430, 215).setDepth(6).setAlpha(0.52).setVisible(false);
          this.leafNote = this.add.image(1290, 515, "intro-leaf").setDisplaySize(190, 190).setDepth(7).setVisible(false);
          this.envelope = this.add.sprite(1160, 655, "intro-envelope", 0).setDisplaySize(185, 185).setDepth(7).setVisible(false);
          this.net = this.add.sprite(0, 0, "intro-net", 0).setDisplaySize(150, 150).setDepth(9).setVisible(false);
          this.pet = this.add.sprite(430, 645, "intro-pet", 0).setDisplaySize(138, 184).setDepth(8).setVisible(false);

          if (!this.anims.exists("intro-net-sweep")) {
            this.anims.create({ key: "intro-net-sweep", frames: this.anims.generateFrameNumbers("intro-net", { start: 0, end: 7 }), frameRate: 16, repeat: 0 });
          }
          if (!this.anims.exists("intro-pet-flutter")) {
            this.anims.create({ key: "intro-pet-flutter", frames: this.anims.generateFrameNumbers("intro-pet", { start: 0, end: 7 }), frameRate: 9, repeat: -1 });
          }

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
                this.destination = point;
                return;
              }
              const introSpot = this.getCurrentIntroductionHotspot();
              if (introSpot && Phaser.Math.Distance.Between(point.x, point.y, introSpot.x, introSpot.y) < introSpot.radius) {
                this.performIntroductionAction(introSpot.action);
                return;
              }
              this.destination = point;
              return;
            }
            const direct = HOTSPOTS.find((hotspot) => Phaser.Math.Distance.Between(point.x, point.y, hotspot.x, hotspot.y) < hotspot.radius);
            if (direct) {
              this.openPanel(direct);
              return;
            }
            this.destination = point;
          });

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
            window.removeEventListener("life-room:pause", this.onPause);
            window.removeEventListener("life-room:memory", this.onMemory);
            window.removeEventListener("life-room:onboarding", this.onOnboarding);
            window.removeEventListener("life-room:onboarding-command", this.onOnboardingCommand);
          });
        }

        private createWindowMark() {
          const mark = this.add.graphics().setDepth(6).setVisible(false);
          mark.lineStyle(5, 0xc9bcff, 0.82);
          mark.strokeCircle(1320, 480, 58);
          mark.lineBetween(1285, 492, 1348, 455);
          mark.lineBetween(1292, 451, 1341, 505);
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
          this.net.setPosition(this.hero.x + 42 * Math.sign(this.hero.scaleX || 1), this.hero.y - 28).setFlipX(this.hero.scaleX < 0).setVisible(true).play("intro-net-sweep", true).setScale(0.34);
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
            this.background.setTint(blend(oldTint, preset.tint));
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
            const x = 164 + index * 9;
            const y = 442 - (index % 3) * 3;
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
          const container = this.add.container(x, y);
          const shadow = this.add.ellipse(0, 28, 72, 24, 0x3d2940, 0.22);
          const body = this.add.ellipse(0, 0, 54, 68, 0x657f78, 1).setStrokeStyle(4, 0x41313f, 0.8);
          const scarf = this.add.rectangle(0, -10, 46, 12, 0xe8a6a5, 1).setStrokeStyle(2, 0x6b4554, 0.8);
          const head = this.add.circle(0, -48, 30, 0xf2c7aa, 1).setStrokeStyle(4, 0x41313f, 0.85);
          const hair = this.add.arc(0, -56, 31, 180, 360, false, 0x493a4e, 1);
          const curlLeft = this.add.circle(-24, -50, 10, 0x493a4e, 1);
          const curlRight = this.add.circle(23, -49, 10, 0x493a4e, 1);
          const eyeLeft = this.add.circle(-10, -45, 2.5, 0x473a47, 1);
          const eyeRight = this.add.circle(10, -45, 2.5, 0x473a47, 1);
          const glow = this.add.circle(0, -18, 54, 0xffe5a8, 0.08);
          container.add([glow, shadow, body, scarf, head, hair, curlLeft, curlRight, eyeLeft, eyeRight]);
          return container;
        }

        private openPanel(hotspot: Hotspot) {
          this.destination = null;
          this.setPaused(true);
          window.dispatchEvent(new CustomEvent("life-room:open", { detail: { panel: hotspot.id, label: hotspot.label } }));
        }

        private updateHero(delta: number) {
          const speed = 270;
          const movement = new Phaser.Math.Vector2(0, 0);
          if (this.keys.left.isDown || this.cursors.left.isDown) movement.x -= 1;
          if (this.keys.right.isDown || this.cursors.right.isDown) movement.x += 1;
          if (this.keys.up.isDown || this.cursors.up.isDown) movement.y -= 1;
          if (this.keys.down.isDown || this.cursors.down.isDown) movement.y += 1;
          if (movement.lengthSq() > 0) {
            this.destination = null;
            movement.normalize().scale((speed * delta) / 1000);
            this.hero.x = Phaser.Math.Clamp(this.hero.x + movement.x, 80, 1460);
            this.hero.y = Phaser.Math.Clamp(this.hero.y + movement.y, 455, 900);
            this.hero.scaleX = movement.x < 0 ? -1 : movement.x > 0 ? 1 : this.hero.scaleX;
          } else if (this.destination) {
            const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, this.destination.x, this.destination.y);
            if (distance < 8) this.destination = null;
            else {
              const direction = new Phaser.Math.Vector2(this.destination.x - this.hero.x, this.destination.y - this.hero.y).normalize().scale((speed * delta) / 1000);
              this.hero.x = Phaser.Math.Clamp(this.hero.x + direction.x, 80, 1460);
              this.hero.y = Phaser.Math.Clamp(this.hero.y + direction.y, 455, 900);
              this.hero.scaleX = direction.x < 0 ? -1 : direction.x > 0 ? 1 : this.hero.scaleX;
            }
          }
          const moving = movement.lengthSq() > 0 || Boolean(this.destination);
          this.hero.rotation = moving && !this.reducedMotion ? Math.sin(this.time.now / 90) * 0.018 : 0;
          this.hero.setDepth(Math.round(this.hero.y + 10));
          if (this.onboardingStep === "net") this.net.setPosition(this.hero.x + 42 * Math.sign(this.hero.scaleX || 1), this.hero.y - 28).setDepth(this.hero.depth + 1).setFlipX(this.hero.scaleX < 0);
        }

        private refreshFurnitureProximity() {
          let nearest: Hotspot | null = null;
          let nearestDistance = Number.POSITIVE_INFINITY;
          for (const hotspot of HOTSPOTS) {
            const distance = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, hotspot.x, hotspot.y);
            if (distance < hotspot.radius && distance < nearestDistance) {
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
