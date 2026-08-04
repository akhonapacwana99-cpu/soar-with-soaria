import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { ToolStudio } from "@/components/app/tool-studio";

export const Route = createFileRoute("/app/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio Builder — CareerPilot AI" },
      { name: "description", content: "Plan a portfolio that tells the story of your work: positioning, structure and case studies." },
      { property: "og:title", content: "Portfolio Builder — CareerPilot AI" },
      { property: "og:description", content: "Positioning, structure and written case studies for your portfolio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ToolStudio
      tool="portfolio"
      icon={Layers}
      title="Portfolio Builder"
      description="Turn scattered work into a portfolio with a clear point of view — positioning, page structure and full case studies."
      cta="Plan my portfolio"
      fields={[
        { key: "Field and goal", label: "Your field and goal", placeholder: "e.g. graphic designer looking for freelance retainer clients", rows: 2 },
        { key: "Projects", label: "Projects to include", placeholder: "For each: what it was, your role, what you did, the outcome", rows: 8 },
        { key: "Audience", label: "Who will view it", placeholder: "e.g. hiring managers, agency creative directors, clients", rows: 2 },
        { key: "Constraints", label: "Constraints", placeholder: "Time, platform, NDA limits, missing assets", rows: 2 },
      ]}
    />
  ),
});
