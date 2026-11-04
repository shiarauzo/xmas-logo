import { track } from "@vercel/analytics";

type EventProps = Record<string, string>;

function utmSource(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("utm_source") ?? undefined;
}

export function trackEvent(name: string, props: EventProps = {}) {
  const source = utmSource();
  track(name, source ? { ...props, utm_source: source } : props);
}
