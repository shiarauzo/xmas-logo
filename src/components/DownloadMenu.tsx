"use client";

import { useEffect, useRef, useState } from "react";
import { menuIndexForKey } from "@/lib/menu-nav";

const press =
  "select-none transition-[transform,background-color,color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export type DownloadKind = "gif" | "png" | "svg" | "avatar";

const ITEMS: { kind: DownloadKind; label: string }[] = [
  { kind: "gif", label: "GIF" },
  { kind: "png", label: "PNG" },
  { kind: "svg", label: "SVG" },
  { kind: "avatar", label: "Avatar 400×400" },
];

type DownloadMenuProps = {
  disabled: boolean;
  onPick: (kind: DownloadKind) => void;
};

export function DownloadMenu({ disabled, onPick }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Opening the menu moves focus to its first item (menu button pattern).
  useEffect(() => {
    if (open) itemsRef.current[0]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Download"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (open) itemsRef.current[0]?.focus();
            else setOpen(true);
          }
        }}
        className={`inline-flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 ${press} ${focusRing}`}
      >
        <DownloadIcon />
      </button>
      {open ? (
        <ul
          role="menu"
          aria-label="Download format"
          onKeyDown={(event) => {
            const items = itemsRef.current.filter(Boolean) as HTMLButtonElement[];
            const index = items.indexOf(document.activeElement as HTMLButtonElement);
            const next = menuIndexForKey(event.key, index, items.length);
            if (next === null) return;
            event.preventDefault();
            items[next].focus();
          }}
          className="absolute right-0 z-30 mt-1.5 min-w-36 rounded-md border border-border bg-card p-1 text-card-foreground shadow-md"
        >
          {ITEMS.map(({ kind, label }, index) => (
            <li key={kind} role="none">
              <button
                ref={(node) => {
                  itemsRef.current[index] = node;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={`flex h-10 w-full items-center rounded-sm px-3 text-left text-sm ${press} ${focusRing} hover:bg-accent hover:text-accent-foreground`}
                onClick={() => {
                  setOpen(false);
                  onPick(kind);
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        d="M12 4v12M7 12l5 5 5-5M5 20h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
