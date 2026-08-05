import { useEffect, useState } from "react";
import { AlertTriangle, Check, ScanText, X } from "lucide-react";
import type { PageExtraction } from "@/lib/pdf";
import { joinPages } from "@/lib/pdf";

/**
 * Review sheet for PDF imports: highlights pages whose text could not be
 * extracted (or came back from OCR with low confidence) so the user can
 * retype or correct them before the text is used.
 */
export function PdfImportReview({
  fileName,
  pages,
  onCancel,
  onApply,
}: {
  fileName: string;
  pages: PageExtraction[];
  onCancel: () => void;
  onApply: (text: string) => void;
}) {
  const [edits, setEdits] = useState<Record<number, string>>({});

  useEffect(() => {
    const next: Record<number, string> = {};
    for (const p of pages) next[p.page] = p.text;
    setEdits(next);
  }, [pages]);

  const flagged = pages.filter((p) => p.status === "failed" || p.status === "low-confidence");

  const apply = () =>
    onApply(joinPages(pages.map((p) => ({ text: edits[p.page] ?? p.text }))));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <ScanText className="h-4.5 w-4.5 text-primary" /> Review imported text
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {fileName} — {pages.length} page{pages.length === 1 ? "" : "s"} scanned,{" "}
              {flagged.length === 0 ? "everything read cleanly" : `${flagged.length} need${flagged.length === 1 ? "s" : ""} your eyes`}.
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close review"
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {pages.map((p) => {
            const flag = p.status === "failed" || p.status === "low-confidence";
            return (
              <section
                key={p.page}
                className={`rounded-xl border p-4 ${
                  flag ? "border-destructive/50 bg-destructive/5" : "border-border bg-background"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Page {p.page}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      flag ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {flag ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                    {p.status === "failed"
                      ? "Could not read"
                      : p.status === "low-confidence"
                        ? `Low confidence${p.confidence ? ` (${Math.round(p.confidence)}%)` : ""}`
                        : p.status === "ocr"
                          ? "Read with OCR"
                          : "Read from text layer"}
                  </span>
                </div>

                {flag && p.thumbnail && (
                  <img
                    src={p.thumbnail}
                    alt={`Scanned image of page ${p.page} that needs review`}
                    className="mb-3 max-h-64 w-full rounded-lg border border-destructive/40 object-contain"
                  />
                )}

                <textarea
                  rows={flag ? 6 : 3}
                  value={edits[p.page] ?? ""}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [p.page]: e.target.value }))}
                  placeholder={flag ? "Type what this page says…" : ""}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/30 focus:ring-2"
                />
              </section>
            );
          })}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={apply}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Use this text
          </button>
        </footer>
      </div>
    </div>
  );
}
