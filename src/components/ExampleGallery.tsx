import { ACCESSORY_BASE_SIZE, ACCESSORY_BY_ID } from "@/lib/accessories";
import { EXAMPLES } from "@/lib/examples";
import { AccessoryArt } from "./AccessoryArt";

export function ExampleGallery() {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-muted-foreground">Examples</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {EXAMPLES.map((item) => {
          const [vbW, vbH] = ACCESSORY_BY_ID[item.accessory].viewBox;
          return (
            <li key={item.id}>
              <figure className="relative aspect-square overflow-hidden rounded-xl border border-border bg-white">
                {/* Brand mark from a local SVG. next/image cannot optimize these static files better here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt=""
                  className="absolute inset-x-[16%] top-[38%] h-[44%] w-[68%] object-contain"
                />
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: `${item.transform.x}%`,
                    top: `${item.transform.y}%`,
                    width: `${item.transform.scale * ACCESSORY_BASE_SIZE * 100}%`,
                    aspectRatio: `${vbW} / ${vbH}`,
                    transform: `translate(-50%, -50%) rotate(${item.transform.rotation}deg)`,
                  }}
                >
                  <AccessoryArt
                    id={item.accessory}
                    prefix={`ex-${item.id}-`}
                    className="h-full w-full overflow-visible"
                  />
                </div>
                <figcaption className="sr-only">{item.name}</figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
