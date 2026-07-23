import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/_marketing/soaria")({
  head: () => ({
    meta: [
      { title: "Meet Soaria — The AI Coach Inside CareerPilot AI" },
      {
        name: "description",
        content:
          "Soaria is not just an AI. She is a mentor, teacher, and career coach — thoughtful, ethical, and always in your corner.",
      },
      { property: "og:title", content: "Meet Soaria" },
      { property: "og:description", content: "Listen before advising. Encourage without exaggeration. Meet your AI career coach." },
    ],
  }),
  component: SoariaPage,
});

const roles = [
  { title: "Mentor", desc: "Guides you through decisions with patience and perspective." },
  { title: "Coach", desc: "Helps you prepare, practice, and refine." },
  { title: "Teacher", desc: "Explains concepts clearly, honoring your pace." },
  { title: "Companion", desc: "Celebrates progress, big and small." },
];

function SoariaPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-20 md:px-8 md:py-28">
      <div className="flex flex-col items-center text-center">
        <Logo className="h-24 w-24" />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Meet Soaria</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          Your <span className="text-gradient-brand">AI career coach.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Soaria listens before she advises, asks thoughtful questions, and encourages without
          exaggeration. She celebrates your progress, respects your privacy, and never promises
          outcomes she can't guarantee.
        </p>
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {roles.map((r) => (
          <div key={r.title} className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold text-foreground">{r.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl border border-border bg-ink p-10 text-ivory shadow-elegant md:p-14">
        <p className="font-display text-sm italic text-ivory/60">Soaria promises</p>
        <ul className="mt-4 space-y-3 text-base md:text-lg">
          <li>· To listen carefully before offering guidance.</li>
          <li>· To explain uncertainty honestly.</li>
          <li>· To never fabricate facts, jobs, or outcomes.</li>
          <li>· To recommend qualified professionals when help exceeds her expertise.</li>
          <li>· To respect who you are, where you're from, and where you're going.</li>
        </ul>
      </div>

      <div className="mt-16 text-center">
        <Link
          to="/app"
          className="inline-flex items-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-90"
        >
          Start a conversation
        </Link>
      </div>
    </div>
  );
}
