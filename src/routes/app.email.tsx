import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { Mail } from "lucide-react";
export const Route = createFileRoute("/app/email")({
  head: () => ({ meta: [{ title: "Email Generator — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={Mail} title="Email Generator" description="Generate polished professional emails with multiple tone options." />,
});
