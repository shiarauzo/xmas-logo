/**
 * Shares a file through the native share sheet when the device supports
 * sharing files. Returns true when the share sheet handled it (or the user
 * dismissed it), false when the caller should fall back to a download.
 */
export async function shareFile(file: File): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") {
    return false;
  }
  if (!navigator.canShare({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file] });
    return true;
  } catch (error) {
    // The user closed the share sheet: don't also download.
    if (error instanceof DOMException && error.name === "AbortError") return true;
    return false;
  }
}
