import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-dawn.jpg";
import { Compass, Sparkles, FileText, Target, BookOpen, Heart } from "lucide-react";

export const Route = createFileRoute("/_marketing/")({
  head: () => ({
    meta: [
      { title: "CareerPilot AI — Your Personal AI Career Coach" },
      {
        name: "description",
        content:
          "Discover your strengths, build professional documents, explore opportunities, and grow your career with Soaria — the AI coach inside CareerPilot AI.",
      },
      { property: "og:title", content: "CareerPilot AI — Navigate Your Future with Confidence" },
      {
        property: "og:description",
        content: "Human-centered AI career development. Powered by Soaria. Designed by Akhona Pacwana.",
      },
    ],
  }),
  component: HomePage,
});

const pillars = [
  { icon: Compass, title: "Career DNA", desc: "A living profile of strengths, values, and growth." },
  { icon: Sparkles, title: "Soaria Coach", desc: "Thoughtful, ethical AI mentorship on demand." },
  { icon: FileText, title: "Document Studio", desc: "CVs, cover letters, portfolios — ATS-ready." },
  { icon: Target, title: "Ascension Journey", desc: "Seeker → Phoenix → Legacy. Progress made visible." },
  { icon: BookOpen, title: "Learning Coach", desc: "Personalized paths for skills that matter." },
  { icon: Heart, title: "Reflection Corner", desc: "Journaling, mindfulness, and original poetry." },
];

function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover opacity-25"
            width={1920}
            height={1024}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        </div>
        <div className="mx-auto max-w-6xl px-5 pt-20 pb-24 md:px-8 md:pt-32 md:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Powered by Soaria
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-7xl">
              Navigate your future <br className="hidden md:block" />
              <span className="text-gradient-brand">with confidence.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              CareerPilot AI is a human-centered career companion — coaching, documents, learning,
              reflection, and opportunities in one thoughtful ecosystem.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/app"
                className="inline-flex items-center rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-90"
              >
                Meet Soaria
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Explore features
              </Link>
            </div>
            <p className="mt-8 font-display text-sm italic text-muted-foreground">
              "Success Delayed Is Not Success Denied."
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">
              An operating system for your career
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-4xl">
              One intelligence. Every stage of your journey.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Every module shares the same Career DNA. Improve your CV, and your Readiness Score
              moves. Complete a reflection, and Soaria adjusts her coaching. Everything you do
              teaches the system who you are becoming.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="group rounded-2xl border border-border bg-card p-6 transition hover:border-accent hover:shadow-elegant"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">
                The Ascension Journey
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-4xl">
                Rise with Purpose. Grow with Wisdom. Lead with Confidence.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                From Seeker to Legacy, your growth is honored at every stage. Not gamified —
                symbolic. Progress that reflects who you're becoming.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Seeker", "Explorer", "Dreamer", "Scholar", "Builder", "Trailblazer", "Professional", "Leader", "Dragon", "Phoenix", "Legacy"].map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-deep/10 via-transparent to-gold/10 p-10 shadow-elegant">
              <div className="absolute inset-0 bg-gradient-brand opacity-[0.08]" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <p className="font-display text-sm italic text-muted-foreground">A note from Soaria</p>
                  <p className="mt-4 font-display text-2xl leading-snug text-foreground md:text-3xl">
                    "You don't need to have it all figured out. You just need to take the next honest step."
                  </p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">— Soaria</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-ink text-ivory">
        <div className="mx-auto max-w-4xl px-5 py-24 text-center md:px-8">
          <h2 className="font-display text-4xl font-semibold md:text-5xl">
            Begin where you are.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ivory/70">
            No account required. Just an honest conversation with Soaria about where you're heading.
          </p>
          <Link
            to="/app"
            className="mt-8 inline-flex items-center rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground shadow-gold transition hover:opacity-90"
          >
            Start with Soaria
          </Link>
        </div>
      </section>
    </>
  );
}
