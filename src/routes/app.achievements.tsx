import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Award } from "lucide-react";
export const Route = createFileRoute("/app/achievements")({
  head: () => ({ meta: [{ title: "Progress & Achievements — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Award} title="Progress & Achievements" description="Milestones, badges, learning streaks, and reflection streaks. Growth honored — never gamified into competition." />,
});
