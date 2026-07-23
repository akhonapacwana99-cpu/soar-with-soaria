import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — CareerPilot AI" },
      { name: "description", content: "Answers about Soaria, privacy, accounts, features, and how CareerPilot AI works." },
      { property: "og:title", content: "FAQ — CareerPilot AI" },
      { property: "og:description", content: "Common questions about CareerPilot AI and Soaria." },
    ],
  }),
  component: FAQPage,
});

const faqs = [
  { q: "Do I need to create an account?", a: "No. CareerPilot welcomes you without login, registration, or passwords. You can share a preferred name, or let Soaria assign you an evolving identity based on your journey." },
  { q: "Who is Soaria?", a: "Soaria is the AI coach inside CareerPilot AI — a mentor, teacher, and career companion. She listens before advising, respects your privacy, and never guarantees outcomes." },
  { q: "Is my data safe?", a: "Your conversations and documents stay under your control. We follow responsible AI principles: privacy first, no manipulation, no exaggerated promises." },
  { q: "Who is CareerPilot for?", a: "Students, graduates, professionals, and career changers — anyone navigating career growth at any stage." },
  { q: "Is it free?", a: "The core coaching experience is designed to be accessible. Full pricing details will be announced as CareerPilot expands." },
  { q: "Who built CareerPilot AI?", a: "CareerPilot AI is designed and developed by Akhona Pacwana." },
];

function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">FAQ</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">Common questions</h1>
      <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map((f) => (
          <details key={f.q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-foreground">
              {f.q}
              <span className="mt-1 text-muted-foreground transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
