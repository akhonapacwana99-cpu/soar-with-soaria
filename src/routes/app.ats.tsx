import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, FileSearch, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { scoreAts } from "@/lib/studio.functions";

export const Route = createFileRoute("/app/ats")({
  head: () => ({
    meta: [
      { title: "ATS Checker — CareerPilot AI" },
      { name: "description", content: "Score your CV against a job description and get specific, actionable fixes." },
      { property: "og:title", content: "ATS Checker — CareerPilot AI" },
      { property: "og:description", content: "See how an applicant tracking system reads your CV, and how to fix it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AtsPage,
});

type Result = Awaited<ReturnType<typeof scoreAts>>;

function AtsPage() {
  const [deviceId, setDeviceId] = useState("");
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    setDeviceId(getDeviceId());
    setResume(localStorage.getItem("ats:resume") ?? "");
    setJd(localStorage.getItem("ats:jd") ?? "");
  }, []);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      localStorage.setItem("ats:resume", resume);
      localStorage.setItem("ats:jd", jd);
      setResult(await scoreAts({ data: { deviceId, resume, jobDescription: jd } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const tone = (s: number) => (s >= 75 ? "text-primary" : s >= 50 ? "text-accent-foreground" : "text-destructive");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <FileSearch className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">ATS Checker</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            See how an applicant tracking system reads your CV — then fix exactly what's holding it back.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Your CV text</span>
            <textarea
              rows={12}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste the full text of your CV here"
              className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/30 focus:ring-2"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Job description (optional, but far more accurate with it)
            </span>
            <textarea
              rows={7}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the advert you're applying for"
              className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/30 focus:ring-2"
            />
          </label>
          <button
            onClick={run}
            disabled={busy || resume.trim().length < 30}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Scanning…" : "Check my CV"}
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="flex items-start gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" /> {error}
              </p>
              <button
                onClick={run}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          )}
          {!error && !result && !busy && (
            <p className="py-16 text-center text-sm text-muted-foreground">Your ATS report will appear here.</p>
          )}
          {busy && (
            <div className="space-y-2 py-16 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Reading your CV the way a machine would…</p>
            </div>
          )}
          {result && !busy && (
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <svg viewBox="0 0 100 100" className="h-28 w-28 flex-none">
                  <circle cx="50" cy="50" r="45" className="fill-none stroke-muted" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="fill-none stroke-primary"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.score / 100) * 283} 283`}
                    transform="rotate(-90 50 50)"
                  />
                  <text x="50" y="56" textAnchor="middle" className="fill-foreground text-[24px] font-semibold">
                    {result.score}
                  </text>
                </svg>
                <p className="text-sm leading-relaxed text-foreground">{result.verdict}</p>
              </div>

              <div className="space-y-3">
                {result.categories.map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className={`text-sm tabular-nums ${tone(c.score)}`}>{c.score}/100</p>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${c.score}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
                  </div>
                ))}
              </div>

              {result.missingKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Missing keywords
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((k) => (
                      <span key={k} className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.fixes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fix these next</p>
                  <ul className="mt-2 space-y-2">
                    {result.fixes.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
