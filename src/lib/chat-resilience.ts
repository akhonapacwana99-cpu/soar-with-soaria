// Shared, framework-free resilience helpers for the Ask Soaria experience.
// Kept pure so they can be unit/integration tested without a browser, a
// database, or the AI gateway.

export const LOAD_TIMEOUT_MS = 15000;
export const STREAM_WATCHDOG_MS = 60000;

export class TimeoutError extends Error {
  constructor(message = "timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Races a promise against a timeout so a hanging server function can never
 * leave the UI spinning forever.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = LOAD_TIMEOUT_MS,
  timers: { setTimeout: typeof setTimeout; clearTimeout: typeof clearTimeout } = globalThis,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = timers.setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      (value) => {
        timers.clearTimeout(id);
        resolve(value);
      },
      (err) => {
        timers.clearTimeout(id);
        reject(err);
      },
    );
  });
}

/** Maps an AI gateway / transport error onto a calm, user-safe message. */
export function mapStreamError(error: unknown): string {
  const generic = "Something interrupted Soaria's reply. Please try again.";
  try {
    const err = error as { statusCode?: number; status?: number; message?: string } | null;
    const raw = err?.statusCode ?? err?.status;
    const status = typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
    if (status === 402) {
      return "Soaria is temporarily unavailable — the AI service is out of credits. Please try again later.";
    }
    if (status === 429) {
      return "Soaria is receiving a lot of requests right now. Please wait a moment and try again.";
    }
    if (status === 401 || status === 403) {
      return "Soaria couldn't authenticate with the AI service. Please try again shortly.";
    }
    if (status && status >= 500) {
      return "The AI service is having trouble right now. Please try again in a moment.";
    }
    const message = typeof err?.message === "string" ? err.message : "";
    if (error instanceof TimeoutError || /timeout|aborted/i.test(message)) {
      return "Soaria took too long to respond. Please try again.";
    }
    return generic;
  } catch {
    // A hostile/throwing property accessor must never escape as an exception.
    return generic;
  }
}


export type StoredMessageLike = {
  id?: unknown;
  role?: unknown;
  content?: unknown;
  parts?: unknown;
  created_at?: unknown;
};

export type UIMessageLike = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: { type: "text"; text: string }[];
};

function textFromParts(parts: unknown): string | null {
  if (!Array.isArray(parts)) return null;
  const text = parts
    .map((p) =>
      p && typeof p === "object" && (p as { type?: unknown }).type === "text"
        ? String((p as { text?: unknown }).text ?? "")
        : "",
    )
    .join("");
  return text.length > 0 ? text : null;
}

/**
 * Turns whatever the database returned into messages the chat UI can render.
 * Tolerates null, undefined, non-array payloads, and rows with missing or
 * malformed `parts` / `content`.
 */
export function normalizeStoredMessages(rows: unknown): UIMessageLike[] {
  if (!Array.isArray(rows)) return [];
  const out: UIMessageLike[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as StoredMessageLike | null;
    if (!row || typeof row !== "object") continue;
    const role =
      row.role === "user" || row.role === "assistant" || row.role === "system"
        ? row.role
        : "assistant";
    const text = textFromParts(row.parts) ?? (typeof row.content === "string" ? row.content : "");
    if (!text.trim()) continue;
    const id = typeof row.id === "string" && row.id ? row.id : `restored-${i}`;
    out.push({ id, role, parts: [{ type: "text", text }] });
  }
  return out;
}

export type ThreadLike = { id: string; title: string; updated_at: string };

/** Same tolerance for the thread sidebar list. */
export function normalizeThreads(rows: unknown): ThreadLike[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .filter((r) => typeof r.id === "string" && (r.id as string).length > 0)
    .map((r) => ({
      id: r.id as string,
      title:
        typeof r.title === "string" && r.title.trim() ? (r.title as string) : "New conversation",
      updated_at: typeof r.updated_at === "string" ? (r.updated_at as string) : "",
    }));
}

export type RestoreFailureReason = "timeout" | "request_failed";

export type RestoreResult =
  | { status: "ready"; threads: ThreadLike[]; messages: UIMessageLike[] }
  | {
      status: "error";
      message: string;
      reason: RestoreFailureReason;
      detail: string;
      threads: ThreadLike[];
      messages: UIMessageLike[];
    };

/** Extracts a short, user-safe description of why a load failed. */
export function describeLoadError(error: unknown): string {
  if (error instanceof TimeoutError) return "The request timed out.";
  try {
    const err = error as { statusCode?: number; status?: number; message?: string } | null;
    const raw = err?.statusCode ?? err?.status;
    const status = typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
    if (status === 404) return "This conversation no longer exists.";
    if (status === 429) return "Too many requests right now.";
    if (status && status >= 500) return "The server had trouble responding.";
    const message = typeof err?.message === "string" ? err.message.trim() : "";
    if (/fetch|network|offline/i.test(message)) return "The network request failed.";
    if (message) return message.slice(0, 140);
    return "An unexpected error occurred.";
  } catch {
    return "An unexpected error occurred.";
  }
}

/**
 * Restores a conversation. Always resolves — never rejects, never hangs —
 * so the caller can unconditionally clear its loading state.
 */
export async function restoreThread(deps: {
  listThreads: () => Promise<unknown>;
  getMessages: () => Promise<unknown>;
  timeoutMs?: number;
  onEvent?: (event: { name: string; reason?: string; detail?: string }) => void;
}): Promise<RestoreResult> {
  try {
    const [threads, messages] = await withTimeout(
      Promise.all([deps.listThreads(), deps.getMessages()]),
      deps.timeoutMs ?? LOAD_TIMEOUT_MS,
    );
    const normalizedThreads = normalizeThreads(threads);
    const normalizedMessages = normalizeStoredMessages(messages);
    if (Array.isArray(threads) && normalizedThreads.length !== threads.length) {
      deps.onEvent?.({ name: "resilience_fallback", reason: "malformed_threads" });
    }
    if (Array.isArray(messages) && normalizedMessages.length !== messages.length) {
      deps.onEvent?.({ name: "resilience_fallback", reason: "malformed_messages" });
    }
    if (threads != null && !Array.isArray(threads)) {
      deps.onEvent?.({ name: "resilience_fallback", reason: "non_array_threads" });
    }
    return {
      status: "ready",
      threads: normalizedThreads,
      messages: normalizedMessages,
    };
  } catch (error) {
    const timedOut = error instanceof TimeoutError;
    const reason: RestoreFailureReason = timedOut ? "timeout" : "request_failed";
    const detail = describeLoadError(error);
    deps.onEvent?.({ name: "thread_load_failed", reason, detail });
    return {
      status: "error",
      reason,
      detail,
      message: timedOut
        ? "We couldn't load this conversation in time. Please try again."
        : "We couldn't load this conversation. Please try again.",
      threads: [],
      messages: [],
    };
  }
}

