import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Mail } from "lucide-react";
export const Route = createFileRoute("/app/cover-letter")({
  head: () => ({ meta: [{ title: "Cover Letter — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Mail} title="Cover Letter Builder" description="Generate personalized cover letters for jobs, internships, scholarships, and graduate programs." />,
});
