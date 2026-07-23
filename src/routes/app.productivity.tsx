import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { ListChecks } from "lucide-react";
export const Route = createFileRoute("/app/productivity")({
  head: () => ({ meta: [{ title: "Productivity Planner — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={ListChecks} title="Productivity Planner" description="Tasks, goals, reminders, schedules, and long-term career planning — all with Soaria's guidance." />,
});
