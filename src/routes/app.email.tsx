import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { ToolStudio } from "@/components/app/tool-studio";

export const Route = createFileRoute("/app/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — CareerPilot AI" },
      { name: "description", content: "Draft professional career emails: applications, follow-ups, networking and negotiation." },
      { property: "og:title", content: "Email Generator — CareerPilot AI" },
      { property: "og:description", content: "Professional career emails drafted in seconds, in your tone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ToolStudio
      tool="email"
      icon={Send}
      title="Email Generator"
      description="Follow-ups, cold outreach, thank-you notes, salary conversations — written clearly and courteously, in your voice."
      cta="Draft my email"
      fields={[
        { key: "Purpose", label: "What is this email for?", placeholder: "e.g. following up after an interview two weeks ago", rows: 2 },
        { key: "Recipient", label: "Who are you writing to?", placeholder: "Name, role, and how well you know them", rows: 2 },
        { key: "Key points", label: "Key points to include", placeholder: "Facts, dates, names, the ask", rows: 5 },
        { key: "Tone", label: "Tone", placeholder: "e.g. polite and brief, or enthusiastic", rows: 1 },
        { key: "Previous message", label: "Previous message (optional)", placeholder: "Paste any thread you're replying to", rows: 4 },
      ]}
    />
  ),
});
