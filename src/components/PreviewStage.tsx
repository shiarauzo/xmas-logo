"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACCESSORY_BY_ID } from "@/lib/accessories";
import {
  SCALE_MAX,
  SCALE_MIN,
  accessoryWidthShare,
  clamp,
  clampToStage,
  stageInsets,
} from "@/lib/geometry";
import type {
  AccessoryId,
  AccessoryTransform,
  LogoAsset,
  MotionId,
} from "@/lib/types";
import { AccessoryArt } from "./AccessoryArt";

type PreviewStageProps = {
  logo: LogoAsset;
  accessoryId: AccessoryId;
  motionId: MotionId;
  transform: AccessoryTransform;
  onChange: (next: AccessoryTransform) => void;
  playId: number;
  reducedMotion: boolean;
};

type PointerMode = "move" | "scale" | "rotate";

type PointerSession = {
  pointerId: number;
  mode: PointerMode;
  startX: number;
  startY: number;
  start: AccessoryTransform;
  originX: number;
  originY: number;
};

// 44px touch target around a 20px visible dot.
const handle =
  "absolute z-[3] flex size-11 items-center justify-center rounded-full touch-none";

const handleDot = (
  <span
    aria-hidden="true"
    className="size-5 rounded-full border-2 border-background bg-primary shadow-sm"
  />
);

export function PreviewStage({
  logo,
  accessoryId,
  motionId,
  transform,
  onChange,
  playId,
  reducedMotion,
}: PreviewStageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const accessoryRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const sessionRef = useRef<PointerSession | null>(null);
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  // While a pointer drag runs, the stage padding stays at the drag's start, so
  // the logo (and the layer the drag math is relative to) doesn't move under
  // the pointer. It catches up when the drag ends.
  const [heldTransform, setHeldTransform] = useState<AccessoryTransform | null>(null);
  const accessory = ACCESSORY_BY_ID[accessoryId];
  const [vbW, vbH] = accessory.viewBox;
  const insets = stageInsets(
    logo,
    accessoryId,
    heldTransform ?? transform,
  );

  const measure = useCallback(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image || image.naturalWidth < 1) return;
    const frameRect = frame.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const scale = Math.min(
      imageRect.width / image.naturalWidth,
      imageRect.height / image.naturalHeight,
    );
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    setBox({
      x: imageRect.left - frameRect.left + (imageRect.width - w) / 2,
      y: imageRect.top - frameRect.top + (imageRect.height - h) / 2,
      w,
      h,
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
  }, [measure, logo.objectUrl, insets.top, insets.right, insets.bottom, insets.left]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const transformRef = useRef(transform);
  transformRef.current = transform;

  function onPointerMove(event: PointerEvent) {
    const session = sessionRef.current;
    const layer = layerRef.current;
    if (!session || !layer) return;
    if (session.mode === "scale") {
      const startDist = Math.hypot(
        session.startX - session.originX,
        session.startY - session.originY,
      );
      const dist = Math.hypot(
        event.clientX - session.originX,
        event.clientY - session.originY,
      );
      if (startDist < 1) return;
      onChangeRef.current({
        ...session.start,
        scale: clamp(session.start.scale * (dist / startDist), SCALE_MIN, SCALE_MAX),
      });
      return;
    }
    if (session.mode === "rotate") {
      const startAngle = Math.atan2(
        session.startY - session.originY,
        session.startX - session.originX,
      );
      const angle = Math.atan2(
        event.clientY - session.originY,
        event.clientX - session.originX,
      );
      const deg = ((angle - startAngle) * 180) / Math.PI;
      onChangeRef.current({
        ...session.start,
        rotation: Math.round(session.start.rotation + deg),
      });
      return;
    }
    const rect = layer.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dx = ((event.clientX - session.startX) / rect.width) * 100;
    const dy = ((event.clientY - session.startY) / rect.height) * 100;
    onChangeRef.current(
      keepInStage({
        ...session.start,
        x: session.start.x + dx,
        y: session.start.y + dy,
      }),
    );
  }

  // Keep the accessory's box inside the stage card (inside its border).
  // Positions already inside pass through untouched, so drags stay 1:1.
  function keepInStage(next: AccessoryTransform) {
    const frame = frameRef.current;
    const layer = layerRef.current;
    if (!frame || !layer) return next;
    const f = frame.getBoundingClientRect();
    const l = layer.getBoundingClientRect();
    if (l.width < 1 || l.height < 1) return next;
    const left = f.left + frame.clientLeft - l.left;
    const top = f.top + frame.clientTop - l.top;
    return clampToStage(next, accessoryId, l.width, l.height, {
      minX: left,
      minY: top,
      maxX: left + frame.clientWidth,
      maxY: top + frame.clientHeight,
    });
  }

  function endPointer(event: PointerEvent) {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    sessionRef.current = null;
    setHeldTransform(null);
    // A resize or rotate can grow the box past the stage edge; settle it
    // back inside once the gesture ends so the pointer never fights it.
    if (session.mode !== "move") {
      onChangeRef.current(keepInStage(transformRef.current));
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endPointer);
    window.removeEventListener("pointercancel", endPointer);
  }

  const beginSession = (
    event: React.PointerEvent,
    mode: PointerMode,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const boxRect = accessoryRef.current?.getBoundingClientRect();
    sessionRef.current = {
      pointerId: event.pointerId,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      start: transform,
      originX: boxRect ? boxRect.left + boxRect.width / 2 : event.clientX,
      originY: boxRect ? boxRect.top + boxRect.height / 2 : event.clientY,
    };
    setHeldTransform(transform);
    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
  };

  const onAccessoryKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 4 : 1;
    const current = transformRef.current;
    const move = (dx: number, dy: number) => {
      event.preventDefault();
      onChange(
        keepInStage({ ...current, x: current.x + dx, y: current.y + dy }),
      );
    };
    if (event.key === "ArrowLeft") move(-step, 0);
    if (event.key === "ArrowRight") move(step, 0);
    if (event.key === "ArrowUp") move(0, -step);
    if (event.key === "ArrowDown") move(0, step);
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      onChange(keepInStage({ ...current, scale: clamp(current.scale + 0.04, SCALE_MIN, SCALE_MAX) }));
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      onChange(keepInStage({ ...current, scale: clamp(current.scale - 0.04, SCALE_MIN, SCALE_MAX) }));
    }
    if (event.key === "[") {
      event.preventDefault();
      onChange(keepInStage({ ...current, rotation: current.rotation - 8 }));
    }
    if (event.key === "]") {
      event.preventDefault();
      onChange(keepInStage({ ...current, rotation: current.rotation + 8 }));
    }
  };

  useEffect(() => {
    const node = accessoryRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = transformRef.current;
      const next = current.scale * (event.deltaY > 0 ? 0.96 : 1.04);
      onChangeRef.current({
        ...current,
        scale: clamp(next, SCALE_MIN, SCALE_MAX),
      });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [accessoryId]);

  return (
    <div
      ref={frameRef}
      data-tone={logo.ink?.tone ?? "light"}
      className="relative flex h-[min(60svh,36rem)] min-h-[240px] w-full lg:h-full items-center justify-center overflow-visible rounded-xl border border-border bg-checker"
      style={{
        paddingTop: `${insets.top * 100}%`,
        paddingRight: `${insets.right * 100}%`,
        paddingBottom: `${insets.bottom * 100}%`,
        paddingLeft: `${insets.left * 100}%`,
      }}
    >
      {/* The logo is an img from a sanitized blob URL so user SVG never runs inline. */}
      {/* Blob URL from a local file. next/image cannot optimize user uploads. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={logo.objectUrl}
        alt={logo.name}
        onLoad={measure}
        className="relative z-[1] h-full min-h-0 w-full min-w-0 object-contain object-center"
        draggable={false}
      />
      <div
        ref={layerRef}
        className="absolute z-[2]"
        style={{
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
        }}
      >
        <div
          ref={accessoryRef}
          data-accessory
          tabIndex={0}
          aria-label="Accessory: drag it, arrow keys move, + / − resize, [ and ] rotate"
          className="absolute cursor-grab touch-none select-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing"
          style={{
            left: `${transform.x}%`,
            top: `${transform.y}%`,
            width: `${accessoryWidthShare(transform.scale) * 100}%`,
            aspectRatio: `${vbW} / ${vbH}`,
            transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
          }}
          onPointerDown={(event) => beginSession(event, "move")}
          onKeyDown={onAccessoryKeyDown}
        >
          <div
            key={playId}
            className={
              reducedMotion
                ? "h-full w-full"
                : `xmas-motion xmas-${motionId} xmas-${accessoryId} h-full w-full`
            }
          >
            <AccessoryArt
              id={accessoryId}
              prefix={`stage-${accessoryId}-`}
              className="pointer-events-none h-full w-full overflow-visible"
            />
          </div>
          <button
            type="button"
            aria-label="Rotate accessory"
            tabIndex={-1}
            className={`${handle} left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-grab`}
            onPointerDown={(event) => beginSession(event, "rotate")}
          >
            {handleDot}
          </button>
          <button
            type="button"
            aria-label="Resize accessory"
            tabIndex={-1}
            className={`${handle} right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize`}
            onPointerDown={(event) => beginSession(event, "scale")}
          >
            {handleDot}
          </button>
        </div>
      </div>
    </div>
  );
}
