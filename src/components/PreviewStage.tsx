"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACCESSORY_BASE_SIZE, ACCESSORY_BY_ID } from "@/lib/accessories";
import { clamp, stageInsets } from "@/lib/geometry";
import { bandToPercents, scanLetterFromImageData, sitOnLetter } from "@/lib/letter";
import type {
  AccessoryId,
  AccessoryTransform,
  LogoAsset,
  PlacementPreset,
} from "@/lib/types";
import { AccessoryArt } from "./AccessoryArt";

type PreviewStageProps = {
  logo: LogoAsset;
  accessoryId: AccessoryId;
  preset: PlacementPreset;
  transform: AccessoryTransform;
  onChange: (next: AccessoryTransform) => void;
  playId: number;
  reducedMotion: boolean;
};

type PointerSession = {
  pointerId: number;
  startX: number;
  startY: number;
  start: AccessoryTransform;
};

export function PreviewStage({
  logo,
  accessoryId,
  preset,
  transform,
  onChange,
  playId,
  reducedMotion,
}: PreviewStageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const sessionRef = useRef<PointerSession | null>(null);
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const accessory = ACCESSORY_BY_ID[accessoryId];
  const [vbW, vbH] = accessory.viewBox;
  const insets = stageInsets(
    logo.naturalWidth,
    logo.naturalHeight,
    accessoryId,
    transform,
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
    const rect = layer.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const dx = ((event.clientX - session.startX) / rect.width) * 100;
    const dy = ((event.clientY - session.startY) / rect.height) * 100;
    onChangeRef.current({
      ...session.start,
      x: clamp(session.start.x + dx, -20, 120),
      y: clamp(session.start.y + dy, -40, 130),
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

  const beginDrag = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      start: transform,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
  };

  const placeOnLetter = async (clientX: number, clientY: number) => {
    const image = imageRef.current;
    if (!image || image.naturalWidth < 1) return;
    const imageRect = image.getBoundingClientRect();
    const scale = Math.min(
      imageRect.width / image.naturalWidth,
      imageRect.height / image.naturalHeight,
    );
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    const rect = {
      left: imageRect.left + (imageRect.width - w) / 2,
      top: imageRect.top + (imageRect.height - h) / 2,
      width: w,
      height: h,
    };
    if (rect.width < 1 || rect.height < 1) return;
    const tapX = ((clientX - rect.left) / rect.width) * image.naturalWidth;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const band = scanLetterFromImageData(
        pixels.data,
        canvas.width,
        canvas.height,
        tapX,
      );
      if (!band) {
        onChange(
          sitOnLetter(accessoryId, logo, {
            xPct: ((clientX - rect.left) / rect.width) * 100,
            topPct: ((clientY - rect.top) / rect.height) * 100,
          }),
        );
        return;
      }
      onChange(
        sitOnLetter(
          accessoryId,
          logo,
          bandToPercents(band, canvas.width, canvas.height),
        ),
      );
    } catch {
      onChange(
        sitOnLetter(accessoryId, logo, {
          xPct: ((clientX - rect.left) / rect.width) * 100,
          topPct: ((clientY - rect.top) / rect.height) * 100,
        }),
      );
    }
  };

  const onFramePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (preset !== "onLetter") return;
    const target = event.target as HTMLElement;
    if (target.closest("[data-accessory]")) return;
    void placeOnLetter(event.clientX, event.clientY);
  };

  const onAccessoryKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 4 : 1;
    const current = transformRef.current;
    const move = (dx: number, dy: number) => {
      event.preventDefault();
      onChange({
        ...current,
        x: clamp(current.x + dx, -20, 120),
        y: clamp(current.y + dy, -40, 130),
      });
    };
    if (event.key === "ArrowLeft") move(-step, 0);
    if (event.key === "ArrowRight") move(step, 0);
    if (event.key === "ArrowUp") move(0, -step);
    if (event.key === "ArrowDown") move(0, step);
  };

  return (
    <div
      ref={frameRef}
      className="relative flex h-full min-h-[240px] w-full items-center justify-center overflow-visible rounded-xl border border-border bg-checker"
      style={{
        paddingTop: `${insets.top * 100}%`,
        paddingRight: `${insets.right * 100}%`,
        paddingBottom: `${insets.bottom * 100}%`,
        paddingLeft: `${insets.left * 100}%`,
      }}
      onPointerDown={onFramePointerDown}
    >
      {/* The logo is an img from a sanitized blob URL so user SVG never runs inline. */}
      {/* Blob URL from a local file. next/image cannot optimize user uploads. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={logo.objectUrl}
        alt={logo.name}
        onLoad={measure}
        className="relative z-[1] h-full w-full object-contain object-center"
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
          data-accessory
          role="button"
          tabIndex={0}
          aria-label="Mover adorno"
          className="absolute cursor-grab touch-none select-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing"
          style={{
            left: `${transform.x}%`,
            top: `${transform.y}%`,
            width: `${transform.scale * ACCESSORY_BASE_SIZE * 100}%`,
            aspectRatio: `${vbW} / ${vbH}`,
            transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
          }}
          onPointerDown={beginDrag}
          onKeyDown={onAccessoryKeyDown}
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
              className="pointer-events-none h-full w-full overflow-visible"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
