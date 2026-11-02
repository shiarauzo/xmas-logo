"use client";

import { ACCESSORY_BASE_SIZE, ACCESSORY_BY_ID, accessoryMarkup } from "@/lib/accessories";
import { EXAMPLES, exampleTransform, type ExampleLogo } from "@/lib/examples";

function ExampleCard({ item }: { item: ExampleLogo }) {
  const transform = exampleTransform(item);
  const [vbW, vbH] = ACCESSORY_BY_ID[item.accessory].viewBox;
  const accW = transform.scale * ACCESSORY_BASE_SIZE * item.width;
  const accH = accW * (vbH / vbW);
  const padTop = item.height * 0.75;
  const padSide = item.width * 0.1;
  const padBottom = item.height * 0.35;

  return (
    <figure
      className="relative overflow-hidden rounded-xl border border-border bg-white"
      style={{ aspectRatio: "5 / 3" }}
    >
      <svg
        viewBox={`${-padSide} ${-padTop} ${item.width + padSide * 2} ${item.height + padTop + padBottom}`}
        className="h-full w-full"
        aria-hidden="true"
      >
        <image
          href={item.src}
          width={item.width}
          height={item.height}
          preserveAspectRatio="xMidYMid meet"
        />
        <g
          transform={`translate(${(transform.x / 100) * item.width} ${(transform.y / 100) * item.height}) rotate(${transform.rotation})`}
        >
          <svg
            x={-accW / 2}
            y={-accH / 2}
            width={accW}
            height={accH}
            viewBox={`0 0 ${vbW} ${vbH}`}
            overflow="visible"
            dangerouslySetInnerHTML={{
              __html: accessoryMarkup(item.accessory, `ex-${item.id}-`),
            }}
          />
        </g>
      </svg>
      <figcaption className="sr-only">{item.name}</figcaption>
    </figure>
  );
}

export function ExampleGallery() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {EXAMPLES.map((item) => (
        <li key={item.id}>
          <ExampleCard item={item} />
        </li>
      ))}
    </ul>
  );
}
