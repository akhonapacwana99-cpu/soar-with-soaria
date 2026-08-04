import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { ToolStudio } from "@/components/app/tool-studio";

export const Route = createFileRoute("/app/cv")({
  head: () => ({
    meta: [
      { title: "CV Builder — CareerPilot AI" },
      { name: "description", content: "Build an ATS-friendly, achievement-led CV with Soaria guiding every section." },
      { property: "og:title", content: "CV Builder — CareerPilot AI" },
      { property: "og:description", content: "Build an ATS-friendly, achievement-led CV with Soaria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ToolStudio
      tool="cv"
      icon={FileText}
      title="CV Builder"
      description="Give Soaria the raw facts. She shapes them into a clean, ATS-friendly CV with achievement-led bullets — never inventing anything you didn't say."
      cta="Build my CV"
      fields={[
        { key: "Target role", label: "Target role", placeholder: "e.g. Junior Data Analyst, Cape Town", rows: 1 },
        { key: "Your details", label: "Name & contact details", placeholder: "Full name, city, email, phone, LinkedIn", rows: 3 },
        { key: "Work experience", label: "Work experience", placeholder: "Role, company, dates, what you did and any results or numbers", rows: 7 },
        { key: "Education & certifications", label: "Education & certifications", placeholder: "Qualification, institution, year", rows: 3 },
        { key: "Skills & tools", label: "Skills & tools", placeholder: "e.g. Excel, SQL, customer service, isiXhosa (fluent)", rows: 3 },
        { key: "Anything else", label: "Anything else", placeholder: "Volunteering, projects, awards, career gaps you want handled well", rows: 3 },
      ]}
    />
  ),
});
