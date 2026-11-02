"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ACCESSORIES, ACCESSORY_MOTION_CSS, placementFor } from "@/lib/accessories";
import { downloadAnimatedSvg, downloadPng } from "@/lib/export";
import { loadSampleLogo, logoFromFile, releaseLogo } from "@/lib/logo";
import type {
  AccessoryId,
  AccessoryTransform,
  LogoAsset,
  PlacementPreset,
} from "@/lib/types";
import { AccessoryArt } from "./AccessoryArt";
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

export function Studio() {
  const [logo, setLogo] = useState<LogoAsset | null>(null);
  const [accessoryId, setAccessoryId] = useState<AccessoryId>("hat");
  const [preset, setPreset] = useState<PlacementPreset>("onTop");
  const [transform, setTransform] = useState<AccessoryTransform>({
    x: 50,
    y: -20,
    scale: 0.48,
    rotation: -8,
  });
  const [playId, setPlayId] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<LogoAsset | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    loadSampleLogo()
      .then((sample) => {
        if (cancelled) {
          releaseLogo(sample);
          return;
        }
        logoRef.current = sample;
        setLogo(sample);
        setTransform(placementFor("onTop", "hat", sample));
      })
      .catch(() => {
        if (!cancelled) setMessage("No se pudo cargar el ejemplo.");
      });
    return () => {
      cancelled = true;
      releaseLogo(logoRef.current);
    };
  }, []);

  const replaceLogo = async (next: LogoAsset) => {
    releaseLogo(logoRef.current);
    logoRef.current = next;
    setLogo(next);
    setTransform(placementFor(preset, accessoryId, next));
    setMessage("");
  };

  const onUpload = async (file?: File) => {
    if (!file) return;
    try {
      const next = await logoFromFile(file);
      await replaceLogo(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo abrir.");
    }
  };

  const applyPreset = (nextPreset: PlacementPreset) => {
    if (!logo) return;
    setPreset(nextPreset);
    setTransform(placementFor(nextPreset, accessoryId, logo));
    setMessage("");
  };

  const chooseAccessory = (id: AccessoryId) => {
    setAccessoryId(id);
    if (logo) {
      setTransform(placementFor(preset, id, logo));
    }
    setPlayId((value) => value + 1);
  };

  const exportSvg = () => {
    if (!logo) return;
    downloadAnimatedSvg(logo, accessoryId, transform);
  };

  const exportPng = async () => {
    if (!logo) return;
    setBusy(true);
    try {
      await downloadPng(logo, accessoryId, transform);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo bajar.");
    } finally {
      setBusy(false);
    }
  };

  const motionStyle = useMemo(
    () => ({ __html: ACCESSORY_MOTION_CSS }),
    [],
  );

  return (
    <div className="relative isolate min-h-full overflow-x-hidden px-3 pb-8 pt-5 sm:px-6 lg:px-8">
      <style dangerouslySetInnerHTML={motionStyle} />
      <div className="pointer-events-none absolute inset-0 -z-10 snow-field" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="min-w-0 font-display text-[2rem] leading-none text-pine sm:text-4xl">
            Gorrito navideño
          </h1>
          <div className="flex min-w-0 flex-col gap-2 sm:items-end">
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-pine px-4 text-sm font-bold text-snow disabled:opacity-50 sm:flex-none"
                disabled={!logo || busy}
                onClick={exportSvg}
              >
                SVG
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pine/20 bg-snow px-4 text-sm font-bold text-pine disabled:opacity-50 sm:flex-none"
                disabled={!logo || busy}
                onClick={() => void exportPng()}
              >
                PNG
              </button>
            </div>
            {message ? (
              <p className="text-sm text-cedar sm:text-right" role="status">
                {message}
              </p>
            ) : null}
          </div>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="relative rounded-[1.8rem] bg-snow/80 p-3 shadow-[0_18px_50px_rgba(79,42,24,0.08)] sm:p-4">
            <button
              type="button"
              className="absolute right-5 top-5 z-10 rounded-full border border-pine/15 bg-snow/90 px-3 py-1.5 text-sm font-semibold text-pine"
              onClick={() => setPlayId((value) => value + 1)}
            >
              Otra vez
            </button>
            <div className="aspect-square w-full max-h-[70vh]">
              {logo ? (
                <PreviewStage
                  logo={logo}
                  accessoryId={accessoryId}
                  transform={transform}
                  onChange={setTransform}
                  playId={playId}
                  reducedMotion={reducedMotion}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-[1.6rem] bg-checker text-sm text-cedar">
                  Cargando…
                </div>
              )}
            </div>
          </section>

          <aside className="min-w-0 rounded-[1.6rem] bg-snow p-4 shadow-[0_12px_36px_rgba(79,42,24,0.06)]">
              <input
                ref={fileRef}
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                onChange={(event) => {
                  void onUpload(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-pine px-4 text-sm font-bold text-snow"
                  onClick={() => fileRef.current?.click()}
                >
                  Subir logo
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pine/20 bg-cream px-4 text-sm font-bold text-pine"
                  onClick={async () => {
                    try {
                      await replaceLogo(await loadSampleLogo());
                    } catch (error) {
                      setMessage(
                        error instanceof Error ? error.message : "No se pudo cargar.",
                      );
                    }
                  }}
                >
                  Ejemplo
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {ACCESSORIES.map((item) => {
                  const selected = item.id === accessoryId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => chooseAccessory(item.id)}
                      className={`flex min-h-[6.5rem] flex-col items-center justify-between rounded-2xl border px-2 py-2 text-sm font-bold ${
                        selected
                          ? "border-berry bg-cream text-berry"
                          : "border-pine/10 bg-cream/40 text-pine"
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
                <button
                  type="button"
                  className={`min-h-11 rounded-full px-3 text-sm font-bold ${
                    preset === "onTop"
                      ? "bg-berry text-snow"
                      : "border border-pine/20 bg-cream text-pine"
                  }`}
                  onClick={() => applyPreset("onTop")}
                >
                  Encima
                </button>
                <button
                  type="button"
                  className={`min-h-11 rounded-full px-3 text-sm font-bold ${
                    preset === "onLetter"
                      ? "bg-berry text-snow"
                      : "border border-pine/20 bg-cream text-pine"
                  }`}
                  onClick={() => applyPreset("onLetter")}
                >
                  En una letra
                </button>
              </div>
              <label className="mt-4 block text-sm font-semibold text-pine">
                Tamaño
                <input
                  type="range"
                  min="0.22"
                  max="2.4"
                  step="0.01"
                  value={transform.scale}
                  onChange={(event) =>
                    setTransform((current) => ({
                      ...current,
                      scale: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full accent-berry"
                />
              </label>
              <label className="mt-3 block text-sm font-semibold text-pine">
                Giro
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={transform.rotation}
                  onChange={(event) =>
                    setTransform((current) => ({
                      ...current,
                      rotation: Number(event.target.value),
                    }))
                  }
                  className="mt-2 w-full accent-berry"
                />
              </label>
              {reducedMotion ? (
                <p className="mt-3 text-sm text-cedar">Animación en pausa.</p>
              ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
