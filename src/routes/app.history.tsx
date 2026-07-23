import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { History } from "lucide-react";
export const Route = createFileRoute("/app/history")({
  head: () => ({ meta: [{ title: "History — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={History} title="History" description="A searchable history of your conversations, documents, reflections, and career plans — with filter, export, restore, and delete." />,
});
