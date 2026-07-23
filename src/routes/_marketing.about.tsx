import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing/about")({
  head: () => ({
    meta: [
      { title: "About CareerPilot AI — A Human-Centered Career Companion" },
      {
        name: "description",
        content:
          "CareerPilot AI is a human-centered ecosystem for career growth — coaching, documents, learning, and reflection in one place.",
      },
      { property: "og:title", content: "About CareerPilot AI" },
      { property: "og:description", content: "Success Delayed Is Not Success Denied. Meet the mission behind CareerPilot AI." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-20 md:px-8 md:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">About</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
        A career companion, not a chatbot.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        CareerPilot AI is a human-centered platform that helps students, graduates, professionals,
        and career changers discover their strengths, build meaningful skills, prepare
        professional documents, explore opportunities, and confidently navigate every stage of
        their careers.
      </p>

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl font-semibold text-foreground">Mission</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Empower people through ethical AI that provides practical guidance, personalized
            coaching, productivity tools, learning support, and career development resources —
            without ever compromising their dignity or independence.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold text-foreground">Vision</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            To become one of the world's most trusted AI-powered career companions — helping
            people discover who they are, develop who they can become, and confidently navigate
            what's next.
          </p>
        </section>
      </div>

      <div className="mt-14 rounded-3xl border border-border bg-card p-8 shadow-elegant md:p-12">
        <h2 className="font-display text-2xl font-semibold text-foreground">Our Principles</h2>
        <ul className="mt-6 grid gap-3 text-sm text-foreground md:grid-cols-2">
          {[
            "Empower before advising.",
            "Progress over perfection.",
            "Learn before leading.",
            "Opportunity begins with preparation.",
            "Every story matters.",
            "The journey shapes the destination.",
            "Success Delayed Is Not Success Denied.",
          ].map((p) => (
            <li key={p} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
              <span className="font-medium">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14 border-t border-border pt-10 text-sm text-muted-foreground">
        <p>
          Designed & Developed by <span className="font-semibold text-foreground">Akhona Pacwana</span>.
        </p>
      </div>
    </div>
  );
}
