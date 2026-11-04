type ShareEnv = {
  matchMedia?: (query: string) => { matches: boolean };
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
};

function browserEnv(): ShareEnv {
  if (typeof window === "undefined" || typeof navigator === "undefined") return {};
  return {
    matchMedia: window.matchMedia?.bind(window),
    canShare: navigator.canShare?.bind(navigator),
    share: navigator.share?.bind(navigator),
  };
}

/** Only touch devices that can share files get the share sheet. */
export function canShareFile(file: File, env: ShareEnv = browserEnv()): boolean {
  if (!env.matchMedia || !env.canShare || !env.share) return false;
  if (!env.matchMedia("(pointer: coarse)").matches) return false;
  return env.canShare({ files: [file] });
}

/**
 * Shares a file through the native share sheet on touch devices that can
 * share files. Returns true when the share sheet handled it (or the user
 * dismissed it), false when the caller should fall back to a download.
 */
export async function shareFile(file: File, env: ShareEnv = browserEnv()): Promise<boolean> {
  if (!canShareFile(file, env)) return false;
  try {
    await env.share!({ files: [file] });
    return true;
  } catch (error) {
    // The user closed the share sheet: don't also download.
    if (error instanceof DOMException && error.name === "AbortError") return true;
    return false;
  }
}
