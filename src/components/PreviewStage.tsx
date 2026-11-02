"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACCESSORY_BY_ID } from "@/lib/accessories";
import type { AccessoryId, AccessoryTransform, LogoAsset } from "@/lib/types";
import { AccessoryArt } from "./AccessoryArt";

type PreviewStageProps = {
  logo: LogoAsset;
  accessoryId: AccessoryId;
  transform: AccessoryTransform;
  onChange: (next: AccessoryTransform) => void;
  playId: number;
  reducedMotion: boolean;
};

type PointerMode = "drag" | "resize" | "rotate";

type PointerSession = {
  mode: PointerMode;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  start: AccessoryTransform;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function angleBetween(cx: number, cy: number, x: number, y: number) {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}

export function PreviewStage({
  logo,
  accessoryId,
  transform,
  onChange,
  playId,
  reducedMotion,
}: PreviewStageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<PointerSession | null>(null);
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const accessory = ACCESSORY_BY_ID[accessoryId];
  const [vbW, vbH] = accessory.viewBox;

  const measure = useCallback(() => {
    const frame = frameRef.current;
    const image = frame?.querySelector("img");
    if (!frame || !image) return;
    const frameRect = frame.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    setBox({
      x: imageRect.left - frameRect.left,
      y: imageRect.top - frameRect.top,
      w: imageRect.width,
      h: imageRect.height,
    });
  }, []);

  useEffect(() => {
    measure();
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, logo.objectUrl]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function onPointerMove(event: PointerEvent) {
    const session = sessionRef.current;
    const layer = layerRef.current;
    if (!session || !layer) return;
    const rect = layer.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const update = onChangeRef.current;

    if (session.mode === "drag") {
      const dx = ((event.clientX - session.startX) / rect.width) * 100;
      const dy = ((event.clientY - session.startY) / rect.height) * 100;
      update({
        ...session.start,
        x: clamp(session.start.x + dx, -8, 108),
        y: clamp(session.start.y + dy, -8, 108),
      });
      return;
    }

    if (session.mode === "resize") {
      const startDist = Math.hypot(
        session.startX - session.originX,
        session.startY - session.originY,
      );
      const nextDist = Math.hypot(
        event.clientX - session.originX,
        event.clientY - session.originY,
      );
      if (startDist < 4) return;
      update({
        ...session.start,
        scale: clamp(session.start.scale * (nextDist / startDist), 0.22, 2.4),
      });
      return;
    }

    const startAngle = angleBetween(
      session.originX,
      session.originY,
      session.startX,
      session.startY,
    );
    const nextAngle = angleBetween(
      session.originX,
      session.originY,
      event.clientX,
      event.clientY,
    );
    update({
      ...session.start,
      rotation: Math.round(session.start.rotation + (nextAngle - startAngle)),
    });
  }

  function endPointer(event: PointerEvent) {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    sessionRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endPointer);
    window.removeEventListener("pointercancel", endPointer);
  }

  const beginPointer = (
    event: React.PointerEvent,
    mode: PointerMode,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const layer = layerRef.current;
    if (!layer) return;
    const rect = layer.getBoundingClientRect();
    const originX = rect.left + (transform.x / 100) * rect.width;
    const originY = rect.top + (transform.y / 100) * rect.height;
    sessionRef.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX,
      originY,
      start: transform,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
  };

  return (
    <div
      ref={frameRef}
      className="relative flex h-full min-h-[240px] w-full items-center justify-center overflow-hidden rounded-[1.6rem] border border-[#e3d2bf] bg-checker"
    >
      {/* The logo is an img from a sanitized blob URL so user SVG never runs inline. */}
      {/* Blob URL from a local file. next/image cannot optimize user uploads. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.objectUrl}
        alt={logo.name}
        onLoad={measure}
        className="max-h-full max-w-full object-contain"
        draggable={false}
      />
      <div
        ref={layerRef}
        className="absolute"
        style={{
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
        }}
      >
        <div
          className="absolute touch-none select-none"
          style={{
            left: `${transform.x}%`,
            top: `${transform.y}%`,
            width: `${transform.scale * 46}%`,
            aspectRatio: `${vbW} / ${vbH}`,
            transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
          }}
        >
          <div
            key={playId}
            className={
              reducedMotion
                ? "h-full w-full"
                : `xmas-motion xmas-${accessoryId} h-full w-full`
            }
          >
            <AccessoryArt
              id={accessoryId}
              prefix={`stage-${accessoryId}-`}
              className="h-full w-full overflow-visible"
            />
          </div>
          <button
            type="button"
            aria-label="Mover adorno"
            className="absolute inset-0 cursor-grab rounded-xl border-2 border-dashed border-pine/50 bg-transparent active:cursor-grabbing"
            onPointerDown={(event) => beginPointer(event, "drag")}
          />
          <button
            type="button"
            aria-label="Girar adorno"
            className="absolute -top-8 left-1/2 z-10 h-7 w-7 -translate-x-1/2 rounded-full border border-[#e3d2bf] bg-snow text-[11px] font-bold text-pine shadow-sm"
            onPointerDown={(event) => beginPointer(event, "rotate")}
          >
            ↻
          </button>
          {["-top-2 -left-2", "-top-2 -right-2", "-bottom-2 -left-2", "-bottom-2 -right-2"].map(
            (place) => (
              <button
                key={place}
                type="button"
                aria-label="Cambiar tamaño"
                className={`absolute z-10 h-4 w-4 rounded-full border-2 border-snow bg-berry shadow-sm ${place}`}
                onPointerDown={(event) => beginPointer(event, "resize")}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
