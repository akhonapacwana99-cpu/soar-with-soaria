import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/app/coming-soon";
import { NotebookPen } from "lucide-react";
export const Route = createFileRoute("/app/notes")({
  head: () => ({ meta: [{ title: "Notes & Summarizer — CareerPilot AI" }] }),
  component: () => <ComingSoon icon={NotebookPen} title="Notes & Summarizer" description="Summarize notes, generate flashcards, extract key points, and understand tough concepts faster." />,
});
