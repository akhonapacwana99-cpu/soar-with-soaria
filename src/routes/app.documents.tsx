import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FolderKanban, FolderPlus, Upload, FileText, Trash2, Sparkles, Loader2, Download, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/device-id";
import { supabase } from "@/integrations/supabase/client";
import { exportMarkdownToPdf, extractPdfDetailed, extractPdfTextLayer } from "@/lib/pdf";
import type { PageExtraction } from "@/lib/pdf";
import { PdfImportReview } from "@/components/app/pdf-import-review";
import {
  createFolder,
  deleteDoc,
  getDocText,
  listDocs,
  listFolders,
  registerDoc,
  summarizeDoc,
  updateDocText,
} from "@/lib/docs.functions";

export const Route = createFileRoute("/app/documents")({
  head: () => ({
    meta: [
      { title: "Document Workspace — CareerPilot AI" },
      { name: "description", content: "Upload, organize, summarize, and export your professional documents as PDF." },
    ],
  }),
  component: DocsPage,
});

type Folder = { id: string; name: string; created_at: string };
type Doc = { id: string; folder_id: string | null; name: string; mime: string; size: number; summary: string | null; created_at: string };

const ACCEPT = ".pdf,.docx,.txt,.md,.png,.jpg,.jpeg";
const MAX = 10 * 1024 * 1024;

async function readText(file: File): Promise<string> {
  if (/\.(txt|md)$/i.test(file.name) || file.type.startsWith("text/")) {
    return (await file.text()).slice(0, 200_000);
  }
  if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
    return await extractPdfTextLayer(file);
  }
  return "";
}


function DocsPage() {
  const [deviceId, setDeviceId] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Doc | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [review, setReview] = useState<{ name: string; docId: string; pages: PageExtraction[] } | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    const d = getDeviceId();
    setDeviceId(d);
    listFolders({ data: { deviceId: d } }).then(setFolders);
    listDocs({ data: { deviceId: d } }).then(setDocs);
  }, []);

  const refreshDocs = async () => {
    const rows = await listDocs({ data: { deviceId, folderId: active } });
    setDocs(rows);
  };

  useEffect(() => {
    if (deviceId) refreshDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, deviceId]);

  const addFolder = async () => {
    const name = prompt("Folder name?");
    if (!name) return;
    const f = await createFolder({ data: { deviceId, name } });
    setFolders((prev) => [...prev, f]);
  };

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX) {
          toast.error(`${file.name} is larger than 10 MB`);
          continue;
        }
        const path = `${deviceId}/${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from("documents").upload(path, file, {
          contentType: file.type || "application/octet-stream",
        });
        if (error) {
          toast.error(`Upload failed: ${error.message}`);
          continue;
        }
        const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
        let extracted = "";
        let pending: PageExtraction[] | null = null;
        if (isPdf) {
          const res = await extractPdfDetailed(file, ({ page, total, stage }) =>
            setUploadStatus(
              stage === "ocr"
                ? `${file.name}: OCR on page ${page}/${total}…`
                : `${file.name}: reading page ${page}/${total}…`,
            ),
          );
          extracted = res.text;
          if (res.needsReview.length > 0) pending = res.pages;
        } else {
          extracted = await readText(file);
        }
        const row = await registerDoc({
          data: {
            deviceId,
            folderId: active,
            name: file.name,
            mime: file.type || "application/octet-stream",
            size: file.size,
            storagePath: path,
            extractedText: extracted,
          },
        });
        if (pending && row?.id) setReview({ name: file.name, docId: row.id, pages: pending });
      }
      toast.success("Upload complete");
      await refreshDocs();
    } finally {
      setBusy(false);
      setUploadStatus("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const doSummarize = async (doc: Doc) => {
    setBusy(true);
    try {
      const { summary } = await summarizeDoc({ data: { deviceId, id: doc.id } });
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, summary } : d)));
      setPreview({ ...doc, summary });
      toast.success("Summary ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Summarize failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (doc: Doc) => {
    if (!confirm(`Delete ${doc.name}?`)) return;
    await deleteDoc({ data: { deviceId, id: doc.id } });
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    if (preview?.id === doc.id) setPreview(null);
  };

  const exportCleaned = (doc: Doc) => {
    if (!doc.summary) {
      toast.error("Run Summarize first");
      return;
    }
    const md = `# ${doc.name}\n\n${doc.summary}\n`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.name.replace(/\.[^.]+$/, "")}-cleaned.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async (doc: Doc) => {
    setBusy(true);
    try {
      const { name, text } = await getDocText({ data: { deviceId, id: doc.id } });
      const body = text?.trim() || doc.summary?.trim();
      if (!body) {
        toast.error("No readable text yet — run Summarize first.");
        return;
      }
      await exportMarkdownToPdf(name.replace(/\.[^.]+$/, ""), body);
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setBusy(false);
    }
  };



  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <FolderKanban className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Document Workspace
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          <button
            onClick={addFolder}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
          >
            <FolderPlus className="h-4 w-4" /> New folder
          </button>
          <button
            onClick={() => setActive(null)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
              active === null ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-accent/30"
            }`}
          >
            All documents
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                active === f.id ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-accent/30"
              }`}
            >
              {f.name}
            </button>
          ))}
        </aside>

        <section className="min-w-0">
          <label className="mb-4 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-sm text-muted-foreground hover:border-primary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>Click or drop files here (PDF, DOCX, TXT, MD, PNG, JPG · 10 MB max)</span>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => upload(e.target.files)}
            />
          </label>

          <div className="grid gap-3">
            {docs.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents yet.</p>
            )}
            {docs.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-1 h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(d.size / 1024).toFixed(1)} KB · {new Date(d.created_at).toLocaleDateString()}
                      {d.summary ? " · Summarized" : ""}
                    </p>
                    {d.summary && (
                      <button
                        onClick={() => setPreview(d)}
                        className="mt-2 text-xs text-primary underline"
                      >
                        View summary
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <button
                      onClick={() => doSummarize(d)}
                      disabled={busy}
                      className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20 disabled:opacity-50"
                    >
                      <Sparkles className="mr-1 inline h-3 w-3" />
                      Summarize
                    </button>
                    <button
                      onClick={() => exportPdf(d)}
                      disabled={busy}
                      className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      <FileDown className="mr-1 inline h-3 w-3" />
                      PDF
                    </button>
                    <button
                      onClick={() => exportCleaned(d)}
                      className="rounded-md bg-muted px-2 py-1 text-xs text-foreground hover:bg-muted/70"
                    >
                      <Download className="mr-1 inline h-3 w-3" />
                      .md
                    </button>

                    <button
                      onClick={() => remove(d)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Summary</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{preview.name}</h2>
            <div className="prose prose-sm mt-4 max-w-none text-foreground">
              <ReactMarkdown>{preview.summary ?? ""}</ReactMarkdown>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => exportPdf(preview)}
                disabled={busy}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                Download PDF
              </button>
              <button
                onClick={() => exportCleaned(preview)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm"
              >
                Export cleaned .md
              </button>

              <button
                onClick={() => setPreview(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
