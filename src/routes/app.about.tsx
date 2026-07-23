import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Info } from "lucide-react";
export const Route = createFileRoute("/app/about")({
  head: () => ({ meta: [{ title: "About — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Info} title="About CareerPilot AI" description="Learn about the mission, vision, and the founder behind CareerPilot AI — Akhona Pacwana." />,
});
