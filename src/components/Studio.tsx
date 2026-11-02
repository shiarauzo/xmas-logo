"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACCESSORIES,
  ACCESSORY_MOTION_CSS,
  MOTIONS,
  placementFor,
} from "@/lib/accessories";
import { downloadAnimatedSvg, downloadPng } from "@/lib/export";
import { logoFromFile, releaseLogo } from "@/lib/logo";
import type {
  AccessoryId,
  AccessoryTransform,
  LogoAsset,
  MotionId,
} from "@/lib/types";
import { AccessoryArt } from "./AccessoryArt";
import { ExampleGallery } from "./ExampleGallery";
import { PreviewStage } from "./PreviewStage";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

const press =
  "select-none transition-[transform,background-color,color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const btn =
  `inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium ${press} ${focusRing}`;

export function Studio() {
  const [logo, setLogo] = useState<LogoAsset | null>(null);
  const [accessoryId, setAccessoryId] = useState<AccessoryId>("hat");
  const [motionId, setMotionId] = useState<MotionId>("jump");
  const [transform, setTransform] = useState<AccessoryTransform>({
    x: 50,
    y: -20,
    scale: 0.48,
    rotation: -8,
  });
  const [playId, setPlayId] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<LogoAsset | null>(null);
  const uploadGen = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      releaseLogo(logoRef.current);
    };
  }, []);

  const openPicker = () => fileRef.current?.click();

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void onUpload(event.dataTransfer.files[0]);
  };

  const replaceLogo = (next: LogoAsset) => {
    releaseLogo(logoRef.current);
    logoRef.current = next;
    setLogo(next);
    setTransform(placementFor("onTop", accessoryId, next));
    setMessage("");
  };

  const onUpload = async (file?: File) => {
    if (!file) return;
    const gen = (uploadGen.current += 1);
    setBusy(true);
    setMessage("Reading…");
    try {
      const next = await logoFromFile(file);
      if (gen !== uploadGen.current) {
        releaseLogo(next);
        return;
      }
      replaceLogo(next);
    } catch (error) {
      if (gen !== uploadGen.current) return;
      setMessage(error instanceof Error ? error.message : "Couldn’t open.");
    } finally {
      if (gen === uploadGen.current) setBusy(false);
    }
  };

  const chooseAccessory = (id: AccessoryId) => {
    if (id === accessoryId) {
      setPlayId((value) => value + 1);
      return;
    }
    setAccessoryId(id);
    if (logo) setTransform(placementFor("onTop", id, logo));
    setPlayId((value) => value + 1);
  };

  const chooseMotion = (id: MotionId) => {
    setMotionId(id);
    setPlayId((value) => value + 1);
  };

  const exportSvg = () => {
    if (!logo) return;
    downloadAnimatedSvg(logo, accessoryId, transform, motionId);
  };

  const exportPng = async () => {
    if (!logo) return;
    setBusy(true);
    try {
      await downloadPng(logo, accessoryId, transform);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn’t download.");
    } finally {
      setBusy(false);
    }
  };

  const motionStyle = useMemo(
    () => ({ __html: ACCESSORY_MOTION_CSS }),
    [],
  );

  return (
    <div className="relative isolate min-h-dvh overflow-x-hidden px-3 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
      <style dangerouslySetInnerHTML={motionStyle} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Xmastize your logo
          </h1>
          <div className="flex min-w-0 flex-col gap-2 sm:items-end">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                className={`${btn} flex-1 bg-primary text-primary-foreground hover:bg-primary/90 sm:flex-none`}
                disabled={!logo || busy}
                onClick={() => void exportPng()}
              >
                Download PNG
              </button>
              <button
                type="button"
                className={`${btn} flex-1 bg-transparent px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:flex-none`}
                disabled={!logo || busy}
                onClick={exportSvg}
              >
                Download SVG
              </button>
            </div>
            <p
              className="min-h-5 text-sm text-muted-foreground sm:text-right"
              role="status"
            >
              {message}
            </p>
          </div>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <aside className="min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground">
            <input
              ref={fileRef}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              tabIndex={-1}
              aria-label="Upload logo"
              onChange={(event) => {
                void onUpload(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              className={`${btn} w-full border border-border bg-background hover:bg-accent hover:text-accent-foreground`}
              onClick={openPicker}
            >
              Upload logo
            </button>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {ACCESSORIES.map((item) => {
                const selected = item.id === accessoryId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => chooseAccessory(item.id)}
                    className={`flex min-h-11 flex-col items-center justify-between rounded-lg border px-2 py-2 text-sm font-medium ${press} ${focusRing} ${
                      selected
                        ? "border-foreground bg-secondary text-foreground"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <AccessoryArt
                      id={item.id}
                      prefix={`pick-${item.id}-`}
                      className="h-14 w-16"
                    />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {MOTIONS.map((motion) => {
                const selected = motion.id === motionId;
                return (
                  <button
                    key={motion.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={reducedMotion}
                    onClick={() => chooseMotion(motion.id)}
                    className={`${btn} ${
                      selected
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-background hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {motion.name}
                  </button>
                );
              })}
            </div>
            {reducedMotion ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Animation paused.
              </p>
            ) : null}
          </aside>

          <div className="aspect-square w-full max-h-[70vh] overflow-visible">
            {logo ? (
              <PreviewStage
                logo={logo}
                accessoryId={accessoryId}
                motionId={motionId}
                transform={transform}
                onChange={setTransform}
                playId={playId}
                reducedMotion={reducedMotion}
              />
            ) : (
              <button
                type="button"
                onClick={openPicker}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                disabled={busy}
                className={`flex h-full min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed ${press} ${focusRing} ${
                  dragging
                    ? "border-foreground bg-accent"
                    : "border-muted-foreground/25 bg-muted/30"
                }`}
              >
                <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="text-sm text-muted-foreground">
                  {dragging ? "Drop" : "Upload a logo"}
                </span>
              </button>
            )}
          </div>
        </div>
        <ExampleGallery />
      </div>
    </div>
  );
}
