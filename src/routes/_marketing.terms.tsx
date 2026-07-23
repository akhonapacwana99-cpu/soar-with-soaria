import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing/terms")({
  head: () => ({
    meta: [
      { title: "Terms — CareerPilot AI" },
      { name: "description", content: "The terms of use for CareerPilot AI." },
      { property: "og:title", content: "Terms — CareerPilot AI" },
      { property: "og:description", content: "Terms of use for CareerPilot AI." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Terms</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">Terms of Use</h1>
      <div className="prose prose-neutral mt-8 max-w-none text-muted-foreground [&_h2]:font-display [&_h2]:text-foreground [&_h2]:mt-8">
        <p>This is placeholder text. Full terms will be published prior to launch.</p>
        <h2>Guidance, not guarantees</h2>
        <p>Soaria provides coaching, suggestions, and educational content. She does not guarantee jobs, admissions, or any specific outcome.</p>
        <h2>Your responsibility</h2>
        <p>You are responsible for the content you create and how you apply CareerPilot AI's suggestions to your career decisions.</p>
      </div>
    </div>
  ),
});
