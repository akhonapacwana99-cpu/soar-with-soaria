import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Settings } from "lucide-react";
export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Settings} title="Settings" description="Personalize your name, preferences, notification cadence, and how Soaria communicates with you." />,
});
