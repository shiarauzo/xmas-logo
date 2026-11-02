import { ACCESSORY_BY_ID, accessoryMarkup } from "@/lib/accessories";
import type { AccessoryId } from "@/lib/types";

type AccessoryArtProps = {
  id: AccessoryId;
  prefix: string;
  className?: string;
};

export function AccessoryArt({ id, prefix, className }: AccessoryArtProps) {
  const meta = ACCESSORY_BY_ID[id];
  const [width, height] = meta.viewBox;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      overflow="visible"
      dangerouslySetInnerHTML={{ __html: accessoryMarkup(id, prefix) }}
    />
  );
}
