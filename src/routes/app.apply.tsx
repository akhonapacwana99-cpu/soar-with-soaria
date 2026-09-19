import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertCircle, Copy, FileDown, Loader2, RefreshCw, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/device-id";
import { getResumeProfile } from "@/lib/resume.functions";
import { generateDocument, listGenerated } from "@/lib/studio.functions";
import { exportMarkdownToPdf } from "@/lib/pdf";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/app/apply")({
  head: () => ({
    meta: [
      { title: "Job Application — CareerPilot AI" },
      {
        name: "description",
        content: "Draft a complete, ready-to-send job application letter from your saved resume and cover letter.",
      },
      { property: "og:title", content: "Job Application — CareerPilot AI" },
      {
        property: "og:description",
        content: "Soaria turns your real resume and cover letter into a tailored application letter, ready to export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplyPage,
});

type Saved = { id: string; name: string; text: string; created_at: string };

function ApplyPage() {
  const [deviceId, setDeviceId] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [advert, setAdvert] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [letters, setLetters] = useState<Saved[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [resultName, setResultName] = useState("Application letter");
  const [history, setHistory] = useState<Saved[]>([]);

  useEffect(() => {
    const d = getDeviceId();
    setDeviceId(d);

    const raw = localStorage.getItem("apply:job");
    if (raw) {
      try {
        const j = JSON.parse(raw) as { title?: string; company?: string; description?: string };
        setRole(j.title ?? "");
        setCompany(j.company ?? "");
        setAdvert(j.description ?? "");
      } catch {
        /* ignore */
      }
    }

    getResumeProfile({ data: { deviceId: d } })
      .then((p) => {
        setResumeText(
          [p.target_role, p.contact, p.experience, p.education, p.skills, p.extras]
            .filter((s) => (s ?? "").trim())
            .join("\n\n"),
        );
        setRole((r) => r || (p.target_role ?? "").trim());
      })
      .catch(() => undefined);

    listGenerated({ data: { deviceId: d, tool: "cover-letter" } })
      .then((rows) => {
        setLetters(rows);
        if (rows[0]) setCoverLetter(rows[0].text);
      })
      .catch(() => undefined);

    listGenerated({ data: { deviceId: d, tool: "application" } })
      .then(setHistory)
      .catch(() => undefined);
  }, []);

  const run = async () => {
    if (!resumeText.trim()) {
      setError("Add your resume details first — build a CV in the CV Builder and it will appear here.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await generateDocument({
        data: {
          deviceId,
          tool: "application",
          title: `Application — ${role || "role"}${company ? ` at ${company}` : ""}`,
          inputs: {
            "Role applied for": role,
            "Company / organisation": company,
            "Job advert": advert,
            "My resume facts": resumeText,
            "My existing cover letter (voice and evidence to reuse)": coverLetter,
          },
        },
      });
      setResult(res.text);
      setResultName(res.name || "Application letter");
      toast.success("Saved to your Document Workspace.");
      listGenerated({ data: { deviceId, tool: "application" } })
        .then(setHistory)
        .catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    try {
      await exportMarkdownToPdf(resultName, result);
      toast.success("PDF downloaded");
      trackEvent("doc_download", { reason: "application:pdf", detail: resultName });
    } catch {
      toast.error("Couldn't build the PDF. Please try again.");
    }
  };

  const field =
    "w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/30 focus:ring-2";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">Job Application</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Soaria writes a full application letter using your saved resume and your own cover-letter voice — tailored
            to the advert, ready to export as a PDF.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Role you're applying for</span>
            <input value={role} onChange={(e) => setRole(e.target.value)} className={field} placeholder="e.g. Junior Data Analyst" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Company or organisation</span>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className={field} placeholder="e.g. Nedbank" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Job advert (loads automatically when you pick a live posting in the ATS Checker)
            </span>
            <textarea rows={7} value={advert} onChange={(e) => setAdvert(e.target.value)} className={field} placeholder="Paste the advert" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Your resume (from CV Builder)</span>
            <textarea rows={6} value={resumeText} onChange={(e) => setResumeText(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Your cover letter</span>
            {letters.length > 1 && (
              <select
                onChange={(e) => setCoverLetter(letters.find((l) => l.id === e.target.value)?.text ?? "")}
                className="mb-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                {letters.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
            <textarea rows={6} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className={field} placeholder="Generate one in Cover Letter and it will appear here" />
          </label>
          <button
            onClick={run}
            disabled={busy || !deviceId}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Soaria is writing…" : "Draft my application"}
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
            <p className="py-16 text-center text-sm text-muted-foreground">Your application letter will appear here.</p>
          )}
          {busy && (
            <div className="space-y-2 py-16 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Matching your evidence to the advert…</p>
            </div>
          )}
          {result && !busy && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                    toast.success("Copied.");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                <button
                  onClick={downloadPdf}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  <FileDown className="h-3.5 w-3.5" /> Download PDF
                </button>
                <button
                  onClick={run}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              </div>
              <article className="prose prose-sm mt-4 max-w-none dark:prose-invert [&_li]:text-foreground [&_p]:text-foreground">
                <ReactMarkdown>{result}</ReactMarkdown>
              </article>
            </>
          )}
        </section>
      </div>

      {history.length > 0 && (
        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Previous applications</p>
          <ul className="mt-3 divide-y divide-border">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => {
                    setResult(h.text);
                    setResultName(h.name);
                    trackEvent("doc_open", { reason: "application", detail: h.name });
                  }}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:opacity-80"
                >
                  <span className="truncate text-sm text-foreground">{h.name}</span>
                  <span className="flex-none text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleDateString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
