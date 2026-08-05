import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { LucideIcon } from "lucide-react";
import { Copy, Download, FileDown, FileUp, Loader2, RefreshCw, Sparkles, History } from "lucide-react";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/device-id";
import { exportMarkdownToPdf, extractPdfText } from "@/lib/pdf";
import { generateDocument, listGenerated } from "@/lib/studio.functions";


export type ToolField = {
  key: string;
  label: string;
  placeholder: string;
  rows?: number;
  required?: boolean;
};

type Saved = { id: string; name: string; text: string; created_at: string };

export function ToolStudio({
  tool,
  icon: Icon,
  title,
  description,
  fields,
  cta = "Generate with Soaria",
}: {
  tool: "cv" | "cover-letter" | "linkedin" | "portfolio" | "email";
  icon: LucideIcon;
  title: string;
  description: string;
  fields: ToolField[];
  cta?: string;
}) {
  const [deviceId, setDeviceId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Saved[]>([]);
  const importRef = useRef<HTMLInputElement>(null);
  const [resultName, setResultName] = useState<string>(title);


  useEffect(() => {
    const d = getDeviceId();
    setDeviceId(d);
    const draft = localStorage.getItem(`studio:${tool}`);
    if (draft) {
      try {
        setValues(JSON.parse(draft) as Record<string, string>);
      } catch {
        /* ignore */
      }
    }
    listGenerated({ data: { deviceId: d, tool } })
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [tool]);

  const set = (k: string, v: string) => {
    const next = { ...values, [k]: v };
    setValues(next);
    localStorage.setItem(`studio:${tool}`, JSON.stringify(next));
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await generateDocument({ data: { deviceId, tool, inputs: values } });
      setResult(res.text);
      toast.success("Saved to your Document Workspace.");
      listGenerated({ data: { deviceId, tool } })
        .then(setHistory)
        .catch(() => undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tool}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-4">
            {fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{f.label}</span>
                <textarea
                  rows={f.rows ?? 3}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/30 focus:ring-2"
                />
              </label>
            ))}
          </div>
          <button
            onClick={run}
            disabled={busy || !deviceId}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Soaria is writing…" : cta}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Soaria only uses what you type plus your saved Career DNA. Nothing is invented.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <button
                onClick={run}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          )}
          {!error && !result && !busy && (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Your draft will appear here.
            </p>
          )}
          {busy && !result && (
            <div className="space-y-2 py-16 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drafting with care…</p>
            </div>
          )}
          {result && (
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
                  onClick={download}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={run}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              </div>
              <article className="prose prose-sm mt-4 max-w-none dark:prose-invert [&_h2]:font-display [&_li]:text-foreground [&_p]:text-foreground">
                <ReactMarkdown>{result}</ReactMarkdown>
              </article>
            </>
          )}
        </section>
      </div>

      {history.length > 0 && (
        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Previous drafts
          </p>
          <ul className="mt-3 divide-y divide-border">
            {history.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => setResult(h.text)}
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
