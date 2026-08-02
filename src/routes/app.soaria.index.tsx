import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { createThread, listThreads } from "@/lib/chat.functions";
import { LOAD_TIMEOUT_MS, TimeoutError, describeLoadError, withTimeout } from "@/lib/chat-resilience";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/app/soaria/")({
  head: () => ({
    meta: [
      { title: "Ask Soaria — CareerPilot AI" },
      { name: "description", content: "Chat with Soaria, your AI career coach. Every conversation is saved." },
    ],
  }),
  component: SoariaLauncher,
});

function SoariaLauncher() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const attempts = useRef(0);
  const [error, setError] = useState<{ message: string; detail: string } | null>(null);

  const start = async () => {
    setError(null);
    attempts.current += 1;
    const attempt = attempts.current;

    // Client-side fallback: never leave the user on a spinner, even if the
    // request promise never settles at all.
    const fallback = setTimeout(() => {
      if (attempt !== attempts.current) return;
      setError({
        message: "We couldn't start your conversation in time.",
        detail: "The request never completed. Please check your connection and try again.",
      });
      trackEvent("thread_load_failed", { reason: "client_fallback", detail: "launcher never settled" });
    }, LOAD_TIMEOUT_MS + 5000);

    try {
      const deviceId = getDeviceId();
      const existing = await withTimeout(listThreads({ data: { deviceId } }), LOAD_TIMEOUT_MS);
      if (existing.length > 0) {
        clearTimeout(fallback);
        await navigate({ to: "/app/soaria/$threadId", params: { threadId: existing[0].id } });
        return;
      }
      const t = await withTimeout(createThread({ data: { deviceId } }), LOAD_TIMEOUT_MS);
      clearTimeout(fallback);
      if (attempt > 1) trackEvent("thread_load_recovered", { detail: `attempt ${attempt}` });
      await navigate({ to: "/app/soaria/$threadId", params: { threadId: t.id } });
    } catch (err) {
      clearTimeout(fallback);
      if (attempt !== attempts.current) return;
      console.error("[soaria] launcher failed", err);
      const detail = describeLoadError(err);
      trackEvent("thread_load_failed", {
        reason: err instanceof TimeoutError ? "timeout" : "request_failed",
        detail,
      });
      setError({ message: "We couldn't load your conversations.", detail });
    }
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void start();
  }, []);

  if (error) {
    return (
      <div
        data-testid="thread-error"
        className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="max-w-md text-sm font-medium text-foreground">{error.message}</p>
        <p className="max-w-md text-xs text-muted-foreground">{error.detail}</p>
        <div className="mt-2 flex gap-2">
          <button
            data-testid="thread-retry"
            onClick={() => { trackEvent("thread_load_retry"); void start(); }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <Link to="/app" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-accent/30">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="thread-loading"
      className="flex h-[calc(100vh-3.5rem)] items-center justify-center"
    >
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <span className="sr-only">Starting your conversation…</span>
    </div>
  );
}
