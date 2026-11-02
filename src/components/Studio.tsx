"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ACCESSORIES, ACCESSORY_MOTION_CSS, placementFor } from "@/lib/accessories";
import { downloadAnimatedSvg, downloadPng } from "@/lib/export";
import {
  bandToPercents,
  firstLetterTapX,
  scanLetterFromImageData,
  sitOnLetter,
} from "@/lib/letter";
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

async function firstLetterTransform(
  logo: LogoAsset,
  accessoryId: AccessoryId,
): Promise<AccessoryTransform> {
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("logo"));
      el.src = logo.objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return placementFor("onLetter", accessoryId, logo);
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tapX = firstLetterTapX(canvas.width, (x) => {
      for (let y = 0; y < canvas.height; y += 1) {
        if (pixels.data[(y * canvas.width + x) * 4 + 3] > 24) return true;
      }
      return false;
    });
    const band = scanLetterFromImageData(
      pixels.data,
      canvas.width,
      canvas.height,
      tapX,
    );
    if (!band) return placementFor("onLetter", accessoryId, logo);
    return sitOnLetter(
      accessoryId,
      logo,
      bandToPercents(band, canvas.width, canvas.height),
    );
  } catch {
    return placementFor("onLetter", accessoryId, logo);
  }
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

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
  const uploadGen = useRef(0);
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
    if (preset === "onLetter") {
      setTransform(await firstLetterTransform(next, accessoryId));
    } else {
      setTransform(placementFor(preset, accessoryId, next));
    }
    setMessage("");
  };

  const onUpload = async (file?: File) => {
    if (!file) return;
    const gen = (uploadGen.current += 1);
    setBusy(true);
    setMessage("Leyendo…");
    try {
      const next = await logoFromFile(file);
      if (gen !== uploadGen.current) {
        releaseLogo(next);
        return;
      }
      await replaceLogo(next);
    } catch (error) {
      if (gen !== uploadGen.current) return;
      setMessage(error instanceof Error ? error.message : "No se pudo abrir.");
    } finally {
      if (gen === uploadGen.current) setBusy(false);
    }
  };

  const applyPreset = async (nextPreset: PlacementPreset) => {
    if (!logo) return;
    setPreset(nextPreset);
    if (nextPreset === "onLetter") {
      setTransform(await firstLetterTransform(logo, accessoryId));
    } else {
      setTransform(placementFor(nextPreset, accessoryId, logo));
    }
    setMessage(nextPreset === "onLetter" ? "Toca una letra." : "");
  };

  const chooseAccessory = async (id: AccessoryId) => {
    if (id === accessoryId) {
      setPlayId((value) => value + 1);
      return;
    }
    setAccessoryId(id);
    if (logo) {
      if (preset === "onLetter") {
        setTransform(await firstLetterTransform(logo, id));
      } else {
        setTransform(placementFor(preset, id, logo));
      }
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
      <div className="pointer-events-none fixed inset-0 -z-10 snow-field" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="min-w-0 font-display text-[2rem] leading-none text-pine sm:text-4xl">
            Gorrito navideño
          </h1>
          <div className="flex min-w-0 flex-col gap-2 sm:items-end">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-pine px-4 text-sm font-bold text-snow disabled:opacity-50 sm:flex-none ${focusRing}`}
                disabled={!logo || busy}
                onClick={() => void exportPng()}
              >
                Bajar PNG
              </button>
              <button
                type="button"
                className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-3 text-sm font-semibold text-cedar disabled:opacity-50 sm:flex-none ${focusRing}`}
                disabled={!logo || busy}
                onClick={exportSvg}
              >
                Bajar SVG
              </button>
            </div>
            <p className="min-h-5 text-sm text-cedar sm:text-right" role="status">
              {message}
            </p>
          </div>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="aspect-square w-full max-h-[70vh] overflow-visible">
            {logo ? (
              <PreviewStage
                logo={logo}
                accessoryId={accessoryId}
                preset={preset}
                transform={transform}
                onChange={setTransform}
                playId={playId}
                reducedMotion={reducedMotion}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-checker text-sm text-cedar">
                Cargando…
              </div>
            )}
          </div>

          <aside className="min-w-0 rounded-[1.6rem] bg-snow p-4 shadow-[0_12px_36px_rgba(79,42,24,0.06)]">
            <input
              ref={fileRef}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              tabIndex={-1}
              aria-label="Subir logo"
              onChange={(event) => {
                void onUpload(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pine/20 bg-cream px-4 text-sm font-bold text-pine ${focusRing}`}
                onClick={() => fileRef.current?.click()}
              >
                Subir logo
              </button>
              <button
                type="button"
                className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pine/20 bg-cream px-4 text-sm font-bold text-pine ${focusRing}`}
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
                    aria-pressed={selected}
                    onClick={() => void chooseAccessory(item.id)}
                    className={`flex min-h-11 flex-col items-center justify-between rounded-2xl border px-2 py-2 text-sm font-bold ${focusRing} ${
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
                aria-pressed={preset === "onTop"}
                className={`min-h-11 rounded-full px-3 text-sm font-bold ${focusRing} ${
                  preset === "onTop"
                    ? "bg-berry text-snow"
                    : "border border-pine/20 bg-cream text-pine"
                }`}
                onClick={() => void applyPreset("onTop")}
              >
                Encima
              </button>
              <button
                type="button"
                aria-pressed={preset === "onLetter"}
                className={`min-h-11 rounded-full px-3 text-sm font-bold ${focusRing} ${
                  preset === "onLetter"
                    ? "bg-berry text-snow"
                    : "border border-pine/20 bg-cream text-pine"
                }`}
                onClick={() => void applyPreset("onLetter")}
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
