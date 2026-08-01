import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { createThread, listThreads } from "@/lib/chat.functions";

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
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    try {
      const deviceId = getDeviceId();
      const existing = await Promise.race([
        listThreads({ data: { deviceId } }),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 15000)),
      ]);
      if (existing.length > 0) {
        await navigate({ to: "/app/soaria/$threadId", params: { threadId: existing[0].id } });
        return;
      }
      const t = await createThread({ data: { deviceId } });
      await navigate({ to: "/app/soaria/$threadId", params: { threadId: t.id } });
    } catch (err) {
      console.error("[soaria] launcher failed", err);
      setError("We couldn't load your conversations. Please check your connection and try again.");
    }
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void start();
  }, []);

  if (error) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="max-w-md text-sm text-muted-foreground">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={() => { ran.current = true; void start(); }}
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
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}
