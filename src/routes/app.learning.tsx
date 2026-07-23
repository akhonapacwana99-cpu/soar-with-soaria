import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { GraduationCap } from "lucide-react";
export const Route = createFileRoute("/app/learning")({
  head: () => ({ meta: [{ title: "Learning Coach — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={GraduationCap} title="Learning Coach" description="Personalized skill development plans and resource recommendations tailored to who you're becoming." />,
});
