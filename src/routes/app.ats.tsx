import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { FileSearch } from "lucide-react";
export const Route = createFileRoute("/app/ats")({
  head: () => ({ meta: [{ title: "ATS Resume Checker — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={FileSearch} title="ATS Resume Checker" description="Analyze your CV against a job description and get precise, prioritized recommendations." />,
});
