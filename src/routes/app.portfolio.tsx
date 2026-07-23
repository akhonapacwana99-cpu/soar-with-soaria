import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Layers } from "lucide-react";
export const Route = createFileRoute("/app/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio Builder — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Layers} title="Portfolio Builder" description="Build a professional digital portfolio that reflects your work, story, and ambition." />,
});
