"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ACCESSORY_BY_ID, accessoryMarkup } from "@/lib/accessories";
import {
  EXAMPLES,
  GOOGLE_LETTER_COLORS,
  WORDMARK_BASELINE,
  WORDMARK_FONT_SIZE,
  WORDMARK_VIEW,
  accessoryFrame,
  wordmarkLayout,
  type ExampleLogo,
  type LetterBox,
} from "@/lib/examples";

function useLetterBoxes(name: string) {
  const ref = useRef<SVGTextElement>(null);
  const [boxes, setBoxes] = useState<{ first: LetterBox; last: LetterBox } | null>(
    null,
  );

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || node.getNumberOfChars() < 1) return;
    try {
      const first = node.getExtentOfChar(0);
      const last = node.getExtentOfChar(name.length - 1);
      setBoxes({
        first: {
          x: first.x,
          y: first.y,
          width: first.width,
          height: first.height,
        },
        last: { x: last.x, y: last.y, width: last.width, height: last.height },
      });
    } catch {
      setBoxes(null);
    }
  }, [name]);

  return { ref, boxes };
}

function WordmarkText({
  item,
  textRef,
}: {
  item: ExampleLogo;
  textRef: RefObject<SVGTextElement | null>;
}) {
  const font = {
    x: WORDMARK_VIEW.width / 2,
    y: WORDMARK_BASELINE,
    fontSize: WORDMARK_FONT_SIZE,
    fontWeight: 700,
    textAnchor: "middle" as const,
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  };

  if (item.id === "google") {
    return (
      <text ref={textRef} {...font}>
        {item.name.split("").map((letter, index) => (
          <tspan key={letter + index} fill={GOOGLE_LETTER_COLORS[index]}>
            {letter}
          </tspan>
        ))}
      </text>
    );
  }

  return (
    <text ref={textRef} {...font} fill={item.color}>
      {item.name}
    </text>
  );
}

function AccessoryOnLetter({
  item,
  letters,
}: {
  item: ExampleLogo;
  letters: { first: LetterBox; last: LetterBox };
}) {
  const frame = accessoryFrame(item.accessory, letters);
  const [vbW, vbH] = ACCESSORY_BY_ID[item.accessory].viewBox;
  const pivotX = frame.x + frame.width / 2;
  const pivotY = frame.y + frame.height * frame.originY;
  const flip = frame.flip
    ? `translate(${frame.x + frame.width} ${frame.y}) scale(-1 1)`
    : `translate(${frame.x} ${frame.y})`;

  return (
    <g transform={`rotate(${frame.rotation} ${pivotX} ${pivotY}) ${flip}`}>
      <svg
        width={frame.width}
        height={frame.height}
        viewBox={`0 0 ${vbW} ${vbH}`}
        overflow="visible"
        dangerouslySetInnerHTML={{
          __html: accessoryMarkup(item.accessory, `ex-${item.id}-`),
        }}
      />
    </g>
  );
}

function ExampleCard({ item }: { item: ExampleLogo }) {
  const { ref, boxes } = useLetterBoxes(item.name);
  const fallback = wordmarkLayout(item.name);
  const letters = boxes ?? fallback;
  const smileY = letters.first.y + letters.first.height + 8;

  return (
    <figure
      className="relative overflow-hidden rounded-xl border border-border bg-white"
      style={{ aspectRatio: `${WORDMARK_VIEW.width} / ${WORDMARK_VIEW.height}` }}
    >
      <svg
        viewBox={`0 0 ${WORDMARK_VIEW.width} ${WORDMARK_VIEW.height}`}
        className="h-full w-full"
        aria-hidden="true"
      >
        <WordmarkText item={item} textRef={ref} />
        {item.id === "amazon" ? (
          <path
            d={`M ${letters.first.x} ${smileY} Q ${WORDMARK_VIEW.width / 2} ${smileY + 18} ${letters.last.x + letters.last.width} ${smileY}`}
            fill="none"
            stroke={item.color}
            strokeWidth="5"
            strokeLinecap="round"
          />
        ) : null}
        <AccessoryOnLetter item={item} letters={letters} />
      </svg>
      <figcaption className="sr-only">{item.name}</figcaption>
    </figure>
  );
}

export function ExampleGallery() {
  return (
    <section id="examples" className="mt-8">
      <h2 className="text-sm font-medium text-muted-foreground">Examples</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {EXAMPLES.map((item) => (
          <li key={item.id}>
            <ExampleCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
