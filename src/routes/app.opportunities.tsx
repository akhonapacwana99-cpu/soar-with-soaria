import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Briefcase } from "lucide-react";
export const Route = createFileRoute("/app/opportunities")({
  head: () => ({ meta: [{ title: "Opportunity Hub — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Briefcase} title="Opportunity Hub" description="Discover jobs, internships, scholarships, bursaries, graduate programs, learnerships, volunteering, and competitions." />,
});
