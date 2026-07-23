import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { HelpCircle } from "lucide-react";
export const Route = createFileRoute("/app/help")({
  head: () => ({ meta: [{ title: "Help — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={HelpCircle} title="Help & Support" description="Guides, walkthroughs, and answers. Soaria is always one click away." />,
});
