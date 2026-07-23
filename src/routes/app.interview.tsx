import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Mic } from "lucide-react";
export const Route = createFileRoute("/app/interview")({
  head: () => ({ meta: [{ title: "Mock Interview — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Mic} title="Mock Interview" description="Interactive interview practice with personalized AI feedback on content, delivery, and confidence." />,
});
