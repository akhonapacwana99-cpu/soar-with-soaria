import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Bell } from "lucide-react";
export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Bell} title="Notifications" description="Timely nudges from Soaria — new opportunities, learning suggestions, and gentle reminders." />,
});
