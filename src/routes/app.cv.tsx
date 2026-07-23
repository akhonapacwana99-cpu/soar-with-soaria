import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { FileText } from "lucide-react";
export const Route = createFileRoute("/app/cv")({
  head: () => ({ meta: [{ title: "CV Builder — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={FileText} title="CV Builder" description="Step-by-step, ATS-friendly CV creation with Soaria's suggestions at every section." />,
});
