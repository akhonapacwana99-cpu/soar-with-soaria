import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Linkedin } from "lucide-react";
export const Route = createFileRoute("/app/linkedin")({
  head: () => ({ meta: [{ title: "LinkedIn Optimizer — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Linkedin} title="LinkedIn Optimizer" description="Improve headline, summary, experience, networking, and overall profile strength." />,
});
