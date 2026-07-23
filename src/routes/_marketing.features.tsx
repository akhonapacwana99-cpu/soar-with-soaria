import { createFileRoute } from "@tanstack/react-router";
import {
  MessageCircle, FileText, Mail, FileSearch, Linkedin, Briefcase,
  GraduationCap, ListChecks, NotebookPen, Mic, Compass, Trophy,
  Heart, Layers, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_marketing/features")({
  head: () => ({
    meta: [
      { title: "Features — CareerPilot AI" },
      { name: "description", content: "Career DNA, Soaria coaching, CV & document builders, mock interviews, learning coach, opportunity hub, reflection corner, and more." },
      { property: "og:title", content: "Features — CareerPilot AI" },
      { property: "og:description", content: "One intelligence. Every stage of your career." },
    ],
  }),
  component: FeaturesPage,
});

const groups = [
  {
    title: "Coaching & Intelligence",
    features: [
      { icon: MessageCircle, name: "Ask Soaria", desc: "Conversational coaching on any career question." },
      { icon: Sparkles, name: "Career DNA", desc: "A living profile that evolves with every interaction." },
      { icon: Compass, name: "Career Explorer", desc: "Discover careers, industries, and pathways." },
      { icon: Trophy, name: "Ascension Journey", desc: "Symbolic stages of growth from Seeker to Legacy." },
    ],
  },
  {
    title: "Document Studio",
    features: [
      { icon: FileText, name: "CV Builder", desc: "Step-by-step, ATS-friendly CVs." },
      { icon: Mail, name: "Cover Letter Builder", desc: "Personalized letters for every opportunity." },
      { icon: FileSearch, name: "ATS Resume Checker", desc: "Analyze CVs against job descriptions." },
      { icon: Linkedin, name: "LinkedIn Optimizer", desc: "Sharpen headline, summary, and profile strength." },
      { icon: Layers, name: "Portfolio Builder", desc: "Professional digital portfolio." },
    ],
  },
  {
    title: "Growth & Preparation",
    features: [
      { icon: Mic, name: "Mock Interview", desc: "Interactive practice with personalized feedback." },
      { icon: GraduationCap, name: "Learning Coach", desc: "Personalized skill development plans." },
      { icon: Briefcase, name: "Opportunity Hub", desc: "Jobs, internships, scholarships, and more." },
      { icon: ListChecks, name: "Productivity Planner", desc: "Tasks, goals, reminders, schedules." },
      { icon: NotebookPen, name: "Notes & Summarizer", desc: "Summarize notes, generate flashcards, extract key ideas." },
      { icon: Heart, name: "Reflection Corner", desc: "Journaling, mindfulness, and featured poetry." },
    ],
  },
];

function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Features</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          A complete <span className="text-gradient-brand">career operating system.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Every module shares the same intelligence. Everything you do teaches CareerPilot who
          you're becoming — and shapes what it recommends next.
        </p>
      </div>

      <div className="mt-16 space-y-16">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="font-display text-2xl font-semibold text-foreground">{g.title}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {g.features.map((f) => (
                <div key={f.name} className="rounded-2xl border border-border bg-card p-6 transition hover:border-accent hover:shadow-elegant">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{f.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
