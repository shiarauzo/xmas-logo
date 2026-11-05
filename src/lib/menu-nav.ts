/** Next focused item for a menu key, or null when the key isn't handled. */
export function menuIndexForKey(key: string, index: number, count: number): number | null {
  if (count < 1) return null;
  if (key === "ArrowDown") return (index + 1) % count;
  if (key === "ArrowUp") return (index - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
