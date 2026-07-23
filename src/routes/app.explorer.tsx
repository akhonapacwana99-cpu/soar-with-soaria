import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Compass } from "lucide-react";
export const Route = createFileRoute("/app/explorer")({
  head: () => ({ meta: [{ title: "Career Explorer — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Compass} title="Career Explorer" description="Explore careers, industries, required qualifications, and career pathways with Soaria as your guide." />,
});
