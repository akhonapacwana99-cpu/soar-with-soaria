import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Target } from "lucide-react";
export const Route = createFileRoute("/app/readiness")({
  head: () => ({ meta: [{ title: "Career Readiness — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Target} title="Career Readiness" description="A dynamic score based on profile completeness, document quality, skills, learning, interview prep, and goals — with clear next steps." />,
});
