import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Heart } from "lucide-react";
export const Route = createFileRoute("/app/reflection")({
  head: () => ({ meta: [{ title: "Reflection Corner — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Heart} title="Reflection Corner" description="Daily reflections, guided journaling, mood check-ins, growth prompts, and featured original poetry." />,
});
