import { createFileRoute } from "@tanstack/react-router";
import { Linkedin } from "lucide-react";
import { ToolStudio } from "@/components/app/tool-studio";

export const Route = createFileRoute("/app/linkedin")({
  head: () => ({
    meta: [
      { title: "LinkedIn Optimizer — CareerPilot AI" },
      { name: "description", content: "Rewrite your headline, About section and experience so recruiters actually find you." },
      { property: "og:title", content: "LinkedIn Optimizer — CareerPilot AI" },
      { property: "og:description", content: "Headline, About and experience rewrites plus a visibility checklist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ToolStudio
      tool="linkedin"
      icon={Linkedin}
      title="LinkedIn Optimizer"
      description="Headline options, a rewritten About section, sharper experience bullets and a visibility checklist — built from your own profile."
      cta="Optimize my profile"
      fields={[
        { key: "Target role or audience", label: "Who should find you?", placeholder: "e.g. recruiters hiring junior developers in South Africa", rows: 2 },
        { key: "Current headline", label: "Current headline", placeholder: "Paste what's there now", rows: 2 },
        { key: "Current About section", label: "Current About section", placeholder: "Paste it, or describe yourself in a few lines", rows: 6 },
        { key: "Experience", label: "Experience", placeholder: "Roles, companies, dates and what you achieved", rows: 6 },
        { key: "Skills and interests", label: "Skills and interests", placeholder: "Tools, strengths, industries you care about", rows: 3 },
      ]}
    />
  ),
});
