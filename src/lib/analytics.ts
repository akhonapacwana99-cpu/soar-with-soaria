// Lightweight, privacy-safe client analytics for resilience monitoring.
// No personal data, no device id — only event names, reason codes and counts.
// Events are kept in a local ring buffer so they can be inspected over time
// (Settings → diagnostics) and mirrored to gtag when analytics is configured.

export type AnalyticsEventName =
  | "thread_load_failed"
  | "thread_load_retry"
  | "thread_load_recovered"
  | "chat_stream_failed"
  | "chat_stream_timeout"
  | "resilience_fallback";

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  reason?: string;
  detail?: string;
  at: string;
};

const KEY = "careerpilot.analytics.v1";
const MAX_EVENTS = 200;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readEvents(): AnalyticsEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearEvents() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Aggregated counts per event + reason, for a simple monitoring view. */
export function summarizeEvents(events: AnalyticsEvent[] = readEvents()) {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const key = e.reason ? `${e.name}:${e.reason}` : e.name;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function trackEvent(
  name: AnalyticsEventName,
  props: { reason?: string; detail?: string } = {},
) {
  const event: AnalyticsEvent = { name, ...props, at: new Date().toISOString() };
  try {
    console.info("[analytics]", event.name, props.reason ?? "", props.detail ?? "");
  } catch {
    /* noop */
  }
  if (!isBrowser()) return event;
  try {
    const next = [...readEvents(), event].slice(-MAX_EVENTS);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — analytics must never break the app */
  }
  try {
    const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
    gtag?.("event", name, { reason: props.reason, detail: props.detail });
  } catch {
    /* noop */
  }
  return event;
}
