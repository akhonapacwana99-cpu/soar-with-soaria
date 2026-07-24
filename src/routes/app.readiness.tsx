import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Target, Loader2, CheckCircle2 } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { computeReadiness, type Readiness } from "@/lib/readiness.functions";

export const Route = createFileRoute("/app/readiness")({
  head: () => ({
    meta: [
      { title: "Career Readiness — CareerPilot AI" },
      { name: "description", content: "Your dynamic readiness score with clear next actions." },
    ],
  }),
  component: ReadinessPage,
});

function ReadinessPage() {
  const [data, setData] = useState<Readiness | null>(null);

  useEffect(() => {
    const d = getDeviceId();
    computeReadiness({ data: { deviceId: d } }).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ring = Math.max(0, Math.min(100, data.total));
  const dash = (ring / 100) * 283;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Career Readiness
        </h1>
      </div>

      <section className="grid gap-8 rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-elegant md:grid-cols-[220px_1fr] md:p-10">
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-44 w-44">
            <circle cx="50" cy="50" r="45" className="fill-none stroke-muted" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              className="fill-none stroke-primary transition-all"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} 283`}
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="54" textAnchor="middle" className="fill-foreground text-[22px] font-semibold">
              {ring}
            </text>
            <text x="50" y="68" textAnchor="middle" className="fill-muted-foreground text-[7px]">
              / 100
            </text>
          </svg>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Overall readiness</p>
          <p className="mt-2 font-display text-2xl leading-snug text-foreground">
            You are {ring < 30 ? "just getting started" : ring < 60 ? "building steady momentum" : ring < 85 ? "in strong shape" : "career-ready"}.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Each dimension below moves your score. The more you use CareerPilot, the more accurate this becomes.
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-3">
        {data.dimensions.map((d) => (
          <div key={d.key} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{d.label}</p>
              <p className="text-sm tabular-nums text-muted-foreground">{d.score}/100</p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${d.score}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{d.hint}</p>
          </div>
        ))}
      </section>

      {data.nextActions.length > 0 && (
        <section className="mt-10 rounded-3xl border border-border bg-card p-6 md:p-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Do this next</p>
          <ul className="mt-4 space-y-3">
            {data.nextActions.map((a) => (
              <li key={a} className="flex items-start gap-3 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
