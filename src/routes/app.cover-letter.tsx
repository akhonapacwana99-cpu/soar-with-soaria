import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { ToolStudio } from "@/components/app/tool-studio";

export const Route = createFileRoute("/app/cover-letter")({
  head: () => ({
    meta: [
      { title: "Cover Letter Writer — CareerPilot AI" },
      { name: "description", content: "Write a tailored, one-page cover letter that maps your real evidence to the role." },
      { property: "og:title", content: "Cover Letter Writer — CareerPilot AI" },
      { property: "og:description", content: "A tailored one-page cover letter, written with Soaria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ToolStudio
      tool="cover-letter"
      icon={Mail}
      title="Cover Letter"
      description="A tailored, one-page letter that connects your real experience to what this specific role is asking for."
      cta="Write my letter"
      fields={[
        { key: "Role and company", label: "Role and company", placeholder: "e.g. Marketing Assistant at Nando's", rows: 1 },
        { key: "Job description", label: "Job description", placeholder: "Paste the advert or the key requirements", rows: 7 },
        { key: "Your relevant experience", label: "Your relevant experience", placeholder: "The experience, results and skills you want highlighted", rows: 6 },
        { key: "Why this company", label: "Why this company matters to you", placeholder: "What genuinely draws you to them", rows: 3 },
        { key: "Tone", label: "Tone", placeholder: "e.g. warm and confident, or formal and concise", rows: 1 },
      ]}
    />
  ),
});
