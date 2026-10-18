"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface Point {
  x: number;
  y: number;
}

const CENTER: Point = { x: 0, y: 0 };

function sendMovement(point: Point) {
  window.dispatchEvent(new CustomEvent("life-room:virtual-move", { detail: point }));
}

export function VirtualJoystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);
  const [knob, setKnob] = useState<Point>(CENTER);

  useEffect(() => () => sendMovement(CENTER), []);

  function update(clientX: number, clientY: number) {
    const bounds = baseRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const radius = bounds.width * 0.31;
    const rawX = clientX - (bounds.left + bounds.width / 2);
    const rawY = clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > radius ? radius / distance : 1;
    const next = { x: rawX * scale, y: rawY * scale };
    setKnob(next);
    sendMovement({ x: next.x / radius, y: next.y / radius });
  }

  function start(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    pointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    update(event.clientX, event.clientY);
  }

  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerRef.current !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    update(event.clientX, event.clientY);
  }

  function stop(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerRef.current !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    pointerRef.current = null;
    setKnob(CENTER);
    sendMovement(CENTER);
  }

  return (
    <div
      ref={baseRef}
      className="virtual-joystick"
      aria-label="Touch joystick. Drag the inner circle to move the character."
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={() => {
        pointerRef.current = null;
        setKnob(CENTER);
        sendMovement(CENTER);
      }}
    >
      <span
        className="virtual-joystick-knob"
        style={{ transform: `translate3d(${knob.x}px, ${knob.y}px, 0)` }}
        aria-hidden="true"
      />
    </div>
  );
}
