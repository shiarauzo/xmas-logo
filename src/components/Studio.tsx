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
  const [message, setMessage] = useState("Logo de ejemplo listo para jugar.");
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
        if (!cancelled) setMessage("No se pudo cargar el logo de ejemplo.");
      });
    return () => {
      cancelled = true;
      releaseLogo(logoRef.current);
    };
  }, []);

  const replaceLogo = async (next: LogoAsset, note: string) => {
    releaseLogo(logoRef.current);
    logoRef.current = next;
    setLogo(next);
    setTransform(placementFor(preset, accessoryId, next));
    setMessage(note);
  };

  const onUpload = async (file?: File) => {
    if (!file) return;
    try {
      const next = await logoFromFile(file);
      await replaceLogo(next, `Listo: ${file.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo abrir el logo.");
    }
  };

  const applyPreset = (nextPreset: PlacementPreset) => {
    if (!logo) return;
    setPreset(nextPreset);
    setTransform(placementFor(nextPreset, accessoryId, logo));
    setMessage(
      nextPreset === "onTop"
        ? "Encima del logo."
        : "En una letra, más chico y ladeado.",
    );
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
    setMessage("Se descargó el SVG animado.");
  };

  const exportPng = async () => {
    if (!logo) return;
    setBusy(true);
    try {
      await downloadPng(logo, accessoryId, transform);
      setMessage("Se descargó el PNG.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo exportar.");
    } finally {
      setBusy(false);
    }
  };

  const motionStyle = useMemo(
    () => ({ __html: ACCESSORY_MOTION_CSS }),
    [],
  );

  return (
    <div className="relative isolate min-h-full overflow-x-hidden px-3 pb-10 pt-5 sm:px-6 lg:px-8">
      <style dangerouslySetInnerHTML={motionStyle} />
      <div className="pointer-events-none absolute inset-0 -z-10 snow-field" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
              Navidad
            </p>
            <h1 className="font-display text-[2rem] leading-none text-pine sm:text-4xl">
              Gorrito navideño
            </h1>
            <p className="mt-2 max-w-xl text-base text-ink/80">
              Sube tu logo y ponle un adorno animado. Todo se queda en tu navegador.
            </p>
          </div>
          <p className="max-w-xs text-sm text-cedar sm:text-right" role="status">
            {message}
          </p>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="rounded-[1.8rem] bg-snow/80 p-3 shadow-[0_18px_50px_rgba(79,42,24,0.08)] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-pine">Tu logo</h2>
              <button
                type="button"
                className="rounded-full border border-pine/15 bg-cream px-3 py-1.5 text-sm font-semibold text-pine"
                onClick={() => setPlayId((value) => value + 1)}
              >
                Ver otra vez
              </button>
            </div>
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
                  Cargando el ejemplo…
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-cedar">
              Arrastra el adorno para moverlo. Las esquinas cambian el tamaño y la flechita lo gira.
            </p>
          </section>

          <aside className="flex min-w-0 flex-col gap-4">
            <section className="rounded-[1.6rem] bg-snow p-4 shadow-[0_12px_36px_rgba(79,42,24,0.06)]">
              <h2 className="font-display text-xl text-pine">Sube tu logo</h2>
              <p className="mt-1 text-sm text-cedar">
                SVG, PNG, JPG o WebP. No sale de este aparato.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
                <button
                  type="button"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-pine px-4 text-sm font-bold text-snow"
                  onClick={() => fileRef.current?.click()}
                >
                  Elegir archivo
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pine/20 bg-cream px-4 text-sm font-bold text-pine"
                  onClick={async () => {
                    try {
                      await replaceLogo(await loadSampleLogo(), "Volviste al logo de ejemplo.");
                    } catch (error) {
                      setMessage(
                        error instanceof Error ? error.message : "No se pudo cargar el ejemplo.",
                      );
                    }
                  }}
                >
                  Logo de ejemplo
                </button>
              </div>
            </section>

            <section className="rounded-[1.6rem] bg-snow p-4 shadow-[0_12px_36px_rgba(79,42,24,0.06)]">
              <h2 className="font-display text-xl text-pine">Elige un adorno</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
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
                      <span className="sr-only">{item.hint}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[1.6rem] bg-snow p-4 shadow-[0_12px_36px_rgba(79,42,24,0.06)]">
              <h2 className="font-display text-xl text-pine">Colócalo</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="min-h-11 rounded-full bg-berry px-3 text-sm font-bold text-snow"
                  onClick={() => applyPreset("onTop")}
                >
                  Encima del logo
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-pine/20 bg-cream px-3 text-sm font-bold text-pine"
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
            </section>

            <section className="rounded-[1.6rem] bg-snow p-4 shadow-[0_12px_36px_rgba(79,42,24,0.06)]">
              <h2 className="font-display text-xl text-pine">Llévalo</h2>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-pine px-4 text-sm font-bold text-snow disabled:opacity-50"
                  disabled={!logo || busy}
                  onClick={exportSvg}
                >
                  Bajar SVG animado
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-pine/20 bg-cream px-4 text-sm font-bold text-pine disabled:opacity-50"
                  disabled={!logo || busy}
                  onClick={() => void exportPng()}
                >
                  Bajar PNG
                </button>
              </div>
              {reducedMotion ? (
                <p className="mt-3 text-sm text-cedar">
                  Animación en pausa por tu preferencia de menos movimiento.
                </p>
              ) : null}
            </section>
          </aside>
        </div>

        <footer className="text-sm text-cedar">
          Hecho para jugar con tu marca en Navidad. Código abierto, sin cuentas ni servidores de subida.
        </footer>
      </div>
    </div>
  );
}
