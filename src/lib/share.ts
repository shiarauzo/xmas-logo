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
 * share files. Returns true only when the file was shared; false (not
 * supported, cancelled, or failed) means the caller should download it.
 */
export async function shareFile(file: File, env: ShareEnv = browserEnv()): Promise<boolean> {
  if (!canShareFile(file, env)) return false;
  try {
    await env.share!({ files: [file] });
    return true;
  } catch {
    // Cancelled (AbortError) or failed: fall back to a normal download.
    return false;
  }
}

export type DeliveryMethod = "share" | "download";

/** Shares the file when possible, otherwise downloads it; says which happened. */
export async function shareOrDownload(
  file: File,
  download: () => void,
  env: ShareEnv = browserEnv(),
): Promise<DeliveryMethod> {
  if (await shareFile(file, env)) return "share";
  download();
  return "download";
}
