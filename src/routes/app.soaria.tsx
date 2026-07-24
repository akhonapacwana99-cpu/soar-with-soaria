import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { createThread, listThreads } from "@/lib/chat.functions";

export const Route = createFileRoute("/app/soaria")({
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

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const deviceId = getDeviceId();
      const existing = await listThreads({ data: { deviceId } });
      if (existing.length > 0) {
        await navigate({ to: "/app/soaria/$threadId", params: { threadId: existing[0].id } });
        return;
      }
      const t = await createThread({ data: { deviceId } });
      await navigate({ to: "/app/soaria/$threadId", params: { threadId: t.id } });
    })();
  }, [navigate]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}
