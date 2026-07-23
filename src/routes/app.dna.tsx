import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Sparkles } from "lucide-react";
export const Route = createFileRoute("/app/dna")({
  head: () => ({ meta: [{ title: "Career DNA — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Sparkles} title="Career DNA" description="A living profile of your strengths, values, personality, learning style, and evolving career recommendations. Updated with every interaction across CareerPilot." />,
});
