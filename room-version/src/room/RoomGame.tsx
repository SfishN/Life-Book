"use client";

import { useEffect, useRef } from "react";
import type { PanelId } from "@/domain/types";

interface RoomGameProps {
  paused: boolean;
  memoryLevel: number;
}

interface Hotspot {
  id: PanelId;
  label: string;
  x: number;
  y: number;
  radius: number;
}

const HOTSPOTS: Hotspot[] = [
  { id: "diary", label: "Success Diary", x: 220, y: 590, radius: 155 },
  { id: "calendar", label: "Calendar", x: 520, y: 320, radius: 150 },
  { id: "guide", label: "Mirror Guide", x: 410, y: 535, radius: 155 },
  { id: "hero", label: "The Dreamer", x: 770, y: 555, radius: 180 },
  { id: "quests", label: "Main Quests", x: 930, y: 330, radius: 170 },
  { id: "achievements", label: "Achievement Wall", x: 1170, y: 370, radius: 170 },
  { id: "todos", label: "To-do List", x: 1190, y: 690, radius: 190 },
  { id: "skills", label: "Skill Tree", x: 115, y: 700, radius: 160 },
  { id: "novel", label: "Life Novel", x: 735, y: 795, radius: 145 },
];

export function RoomGame({ paused, memoryLevel }: RoomGameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<{
    destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
  } | null>(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("life-room:pause", { detail: { paused } }));
  }, [paused]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("life-room:memory", { detail: { memoryLevel } }));
  }, [memoryLevel]);

  useEffect(() => {
    let cancelled = false;

    async function mountGame() {
      if (!hostRef.current || gameRef.current) return;
      const Phaser = (await import("phaser")).default;
      if (cancelled || !hostRef.current) return;

      class DreamRoomScene extends Phaser.Scene {
        private hero!: Phaser.GameObjects.Container;
        private keys!: Record<"up" | "down" | "left" | "right" | "interact", Phaser.Input.Keyboard.Key>;
        private destination: Phaser.Math.Vector2 | null = null;
        private nearest: Hotspot | null = null;
        private panelOpen = false;
        private memoryGlow!: Phaser.GameObjects.Particles.ParticleEmitter;
        private onPause = (event: Event) => {
          this.panelOpen = Boolean((event as CustomEvent<{ paused: boolean }>).detail.paused);
          this.destination = null;
        };
        private onMemory = (event: Event) => {
          const level = (event as CustomEvent<{ memoryLevel: number }>).detail.memoryLevel;
          if (this.memoryGlow) this.memoryGlow.frequency = Math.max(240, 920 - level * 70);
        };

        constructor() {
          super("dream-room");
        }

        preload() {
          this.load.image("dream-room", "/room/dream-room.png");
        }

        create() {
          const background = this.add.image(768, 512, "dream-room");
          background.setDisplaySize(1536, 1024);

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
          this.memoryGlow = this.add.particles(760, 745, "memory-speck", {
            lifespan: { min: 1800, max: 3200 },
            speedY: { min: -18, max: -6 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.65, end: 0 },
            alpha: { start: 0.65, end: 0 },
            frequency: 700,
            quantity: 1,
            blendMode: Phaser.BlendModes.ADD,
          });
          this.memoryGlow.setDepth(3);

          for (const hotspot of HOTSPOTS) {
            const ring = this.add.ellipse(hotspot.x, hotspot.y, hotspot.radius * 1.1, hotspot.radius * 0.48);
            ring.setStrokeStyle(3, 0xffe7aa, 0.13);
            ring.setFillStyle(0xffe7aa, 0.015);
            ring.setDepth(2);
          }

          this.hero = this.createHero(745, 780);
          this.hero.setDepth(8);

          const keyboard = this.input.keyboard;
          if (keyboard) {
            this.keys = {
              up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
              down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
              left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
              right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
              interact: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            };
          }

          this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            if (this.panelOpen) return;
            const point = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
            const direct = HOTSPOTS.find(
              (hotspot) => Phaser.Math.Distance.Between(point.x, point.y, hotspot.x, hotspot.y) < hotspot.radius,
            );
            if (direct) {
              this.openPanel(direct);
              return;
            }
            this.destination = point;
          });

          window.addEventListener("life-room:pause", this.onPause);
          window.addEventListener("life-room:memory", this.onMemory);
          this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            window.removeEventListener("life-room:pause", this.onPause);
            window.removeEventListener("life-room:memory", this.onMemory);
          });
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
          window.dispatchEvent(
            new CustomEvent("life-room:open", { detail: { panel: hotspot.id, label: hotspot.label } }),
          );
        }

        update(_time: number, delta: number) {
          if (!this.keys || this.panelOpen) return;
          const speed = 270;
          const movement = new Phaser.Math.Vector2(0, 0);
          if (this.keys.left.isDown) movement.x -= 1;
          if (this.keys.right.isDown) movement.x += 1;
          if (this.keys.up.isDown) movement.y -= 1;
          if (this.keys.down.isDown) movement.y += 1;

          if (movement.lengthSq() > 0) {
            this.destination = null;
            movement.normalize().scale((speed * delta) / 1000);
            this.hero.x = Phaser.Math.Clamp(this.hero.x + movement.x, 80, 1460);
            this.hero.y = Phaser.Math.Clamp(this.hero.y + movement.y, 455, 900);
            this.hero.scaleX = movement.x < 0 ? -1 : movement.x > 0 ? 1 : this.hero.scaleX;
          } else if (this.destination) {
            const distance = Phaser.Math.Distance.Between(
              this.hero.x,
              this.hero.y,
              this.destination.x,
              this.destination.y,
            );
            if (distance < 8) {
              this.destination = null;
            } else {
              const direction = new Phaser.Math.Vector2(
                this.destination.x - this.hero.x,
                this.destination.y - this.hero.y,
              )
                .normalize()
                .scale((speed * delta) / 1000);
              this.hero.x = Phaser.Math.Clamp(this.hero.x + direction.x, 80, 1460);
              this.hero.y = Phaser.Math.Clamp(this.hero.y + direction.y, 455, 900);
              this.hero.scaleX = direction.x < 0 ? -1 : direction.x > 0 ? 1 : this.hero.scaleX;
            }
          }

          const moving = movement.lengthSq() > 0 || Boolean(this.destination);
          this.hero.rotation = moving ? Math.sin(this.time.now / 90) * 0.018 : 0;
          this.hero.setDepth(Math.round(this.hero.y + 10));

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
            window.dispatchEvent(
              new CustomEvent("life-room:proximity", {
                detail: nearest ? { panel: nearest.id, label: nearest.label } : null,
              }),
            );
          }
          if (this.nearest && Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
            this.openPanel(this.nearest);
          }
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
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 1536,
          height: 1024,
        },
      });
    }

    void mountGame();
    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div className="room-game" ref={hostRef} aria-label="Interactive dream room" />;
}
