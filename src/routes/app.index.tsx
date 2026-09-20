import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Target, Trophy, ArrowRight, MessageCircle, FileText, Compass, GraduationCap, Loader2 } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { computeReadiness, type Readiness } from "@/lib/readiness.functions";
import { getDna, type DnaRow } from "@/lib/dna.functions";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — CareerPilot AI" },
      { name: "description", content: "Your CareerPilot dashboard: readiness score, Career DNA, Ascension Journey, and today's priorities." },
    ],
  }),
  component: Dashboard,
});

const stages = ["Seeker", "Explorer", "Dreamer", "Scholar", "Builder", "Trailblazer", "Professional", "Leader", "Dragon", "Phoenix", "Legacy"];

// Map a 0–100 readiness score to an Ascension Journey stage index.
function stageFromReadiness(total: number): number {
  if (total <= 0) return 0; // Seeker
  return Math.min(stages.length - 1, Math.floor(total / 10));
}

function dnaSummary(dna: DnaRow): string {
  const counts =
    dna.strengths.length +
    dna.skills.length +
    dna.interests.length +
    dna.core_values.length;
  if (counts === 0) return "Your Career DNA is still forming.";

  const traits: string[] = [];
  if (dna.strengths.length) traits.push(`a ${dna.strengths[0]}`);
  if (dna.interests.length) traits.push(`drawn to ${dna.interests[0]}`);
  if (dna.skills.length) traits.push(`skilled in ${dna.skills[0]}`);

  if (traits.length >= 2) {
    return `You're ${traits.slice(0, -1).join(", ")} and ${traits[traits.length - 1]}.`;
  }
  if (traits.length === 1) {
    return `You're ${traits[0]}.`;
  }
  return "Your Career DNA is still forming.";
}

function Dashboard() {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [dna, setDna] = useState<DnaRow | null>(null);

  useEffect(() => {
    const d = getDeviceId();
    computeReadiness({ data: { deviceId: d } }).then(setReadiness);
    getDna({ data: { deviceId: d } }).then(setDna);
  }, []);

  if (!readiness || !dna) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ring = Math.max(0, Math.min(100, readiness.total));
  const currentStage = stageFromReadiness(ring);
  const isNewUser = ring === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-foreground/70">Welcome back</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-foreground md:text-4xl">
            Good to see you, <span className="text-gradient-brand">{stages[currentStage]}.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Success delayed is not success denied. Here's where you are today.</p>
        </div>
        <Link
          to="/app/soaria"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" /> Ask Soaria
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Readiness</p>
            <Target className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-4 font-display text-4xl font-semibold text-foreground">{ring}<span className="text-lg text-muted-foreground">/100</span></p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gradient-brand transition-all" style={{ width: `${ring}%` }} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {isNewUser ? "Complete your Career DNA to unlock more." : "Keep building momentum — every action counts."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Career DNA</p>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-4 text-sm text-foreground">{dnaSummary(dna)}</p>
          <Link to="/app/dna" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Explore your DNA <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-ink to-emerald-deep p-6 text-ivory">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory/60">Stage</p>
            <Trophy className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-4 font-display text-3xl font-semibold">{stages[currentStage]}</p>
          <p className="mt-2 text-xs text-ivory/70">
            {currentStage < stages.length - 1 ? `Next: ${stages[currentStage + 1]}` : "You've reached the summit."}
          </p>
        </div>
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Ascension Journey</h2>
          <Link to="/app/journey" className="text-xs font-medium text-primary hover:underline">View journey</Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {stages.map((s, i) => (
            <span
              key={s}
              className={
                "rounded-full px-3 py-1 text-xs font-medium border " +
                (i < currentStage
                  ? "border-emerald-brand/40 bg-emerald-brand/10 text-emerald-deep"
                  : i === currentStage
                  ? "border-accent bg-accent text-accent-foreground shadow-gold"
                  : "border-border bg-background text-muted-foreground")
              }
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Today's priorities</h2>
          <ul className="mt-4 space-y-3">
            {[
              { t: "Chat with Soaria about your next 90 days", to: "/app/soaria", i: MessageCircle },
              { t: "Draft the first version of your CV", to: "/app/cv", i: FileText },
              { t: "Explore three careers that match your interests", to: "/app/explorer", i: Compass },
              { t: "Pick one skill to focus on this week", to: "/app/learning", i: GraduationCap },
            ].map((x) => (
              <li key={x.t}>
                <Link to={x.to} className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3 transition hover:border-accent">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <x.i className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{x.t}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-emerald-brand/[0.05] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground/70">Reflection of the day</p>
          <p className="mt-4 font-display text-xl italic leading-snug text-foreground">
            "Do not rush the rising. Even the sun takes its time."
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">— from Within The Silence</p>
          <Link to="/app/reflection" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Open Reflection Corner <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
