import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Trophy } from "lucide-react";
export const Route = createFileRoute("/app/journey")({
  head: () => ({ meta: [{ title: "Ascension Journey — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Trophy} title="Ascension Journey" description="Move symbolically from Seeker to Legacy. Every stage unlocks new recommendations, achievements, and coaching depth." />,
});
