import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { FolderKanban } from "lucide-react";
export const Route = createFileRoute("/app/documents")({
  head: () => ({ meta: [{ title: "Document Workspace — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={FolderKanban} title="Document Workspace" description="Create, upload, edit, organize, summarize, and export every professional document you need — all in one place." />,
});
