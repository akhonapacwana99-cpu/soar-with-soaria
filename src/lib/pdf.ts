// Client-side PDF helpers: export markdown documents to PDF, and import
// text back out of an uploaded PDF. Both libraries are loaded lazily so they
// never end up in the SSR bundle.

function stripInline(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
    .replace(/^>\s?/, "")
    .trim();
}

export function pdfFileName(name: string) {
  return `${name.replace(/\.[^.]+$/, "").replace(/[^\w\-. ]+/g, "").trim() || "document"}.pdf`;
}

/** Render a markdown string into a clean, ATS-friendly A4 PDF and download it. */
export async function exportMarkdownToPdf(title: string, markdown: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (text: string, size: number, style: "normal" | "bold", indent = 0, gap = 6) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth - indent) as string[];
    for (const line of lines) {
      ensureSpace(size * 1.35);
      doc.text(line, margin + indent, y);
      y += size * 1.35;
    }
    y += gap;
  };

  write(title, 18, "bold", 0, 10);

  for (const raw of markdown.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      y += 6;
      continue;
    }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      ensureSpace(14);
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 14;
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1]!.length;
      y += 4;
      write(stripInline(heading[2]!), level <= 1 ? 16 : level === 2 ? 13.5 : 12, "bold", 0, 4);
      continue;
    }
    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      write(`•  ${stripInline(bullet[1]!)}`, 10.5, "normal", 12, 2);
      continue;
    }
    const numbered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      write(`${numbered[1]}.  ${stripInline(numbered[2]!)}`, 10.5, "normal", 12, 2);
      continue;
    }
    write(stripInline(line), 10.5, "normal", 0, 4);
  }

  doc.save(pdfFileName(title));
}

export type PageStatus = "text" | "ocr" | "low-confidence" | "failed";

export type PageExtraction = {
  page: number;
  status: PageStatus;
  text: string;
  /** OCR confidence 0-100, when OCR was used. */
  confidence: number | null;
  /** PNG data URL of the rendered page, present when the page needs review. */
  thumbnail: string | null;
};

export type PdfExtraction = {
  text: string;
  pages: PageExtraction[];
  /** Pages that produced nothing or low-confidence OCR and should be reviewed. */
  needsReview: PageExtraction[];
  ocrUsed: boolean;
};

/** Pages with fewer characters than this are treated as scanned and sent to OCR. */
const TEXT_LAYER_MIN_CHARS = 40;
const OCR_CONFIDENCE_MIN = 70;

export function joinPages(pages: { text: string }[]) {
  return pages
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 200_000);
}

/**
 * Extract text from a PDF, falling back to in-browser OCR for scanned pages.
 * Never throws: failures surface as `failed` pages the user can review.
 */
export async function extractPdfDetailed(
  file: File | Blob,
  onProgress?: (info: { page: number; total: number; stage: "text" | "ocr" }) => void,
): Promise<PdfExtraction> {
  const pages: PageExtraction[] = [];
  let ocrUsed = false;
  try {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const limit = Math.min(pdf.numPages, 40);

    type OcrWorker = { recognize: (img: unknown) => Promise<{ data: { text?: string; confidence?: number } }>; terminate: () => Promise<unknown> };
    let worker: OcrWorker | null = null;
    const getWorker = async () => {
      if (!worker) {
        const { createWorker } = await import("tesseract.js");
        worker = (await createWorker("eng")) as unknown as OcrWorker;
      }
      return worker;
    };

    for (let i = 1; i <= limit; i++) {
      onProgress?.({ page: i, total: limit, stage: "text" });
      let entry: PageExtraction = { page: i, status: "failed", text: "", confidence: null, thumbnail: null };
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        if (text.length >= TEXT_LAYER_MIN_CHARS) {
          entry = { page: i, status: "text", text, confidence: null, thumbnail: null };
        } else {
          // Scanned or image-only page — render it and run OCR.
          onProgress?.({ page: i, total: limit, stage: "ocr" });
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(viewport.width, 2000);
          canvas.height = Math.min(viewport.height, 2600);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas unavailable");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext: ctx, viewport } as never).promise;
          const thumbnail = canvas.toDataURL("image/png");

          let ocrText = "";
          let confidence = 0;
          try {
            const w = await getWorker();
            const { data } = await w.recognize(canvas);
            ocrUsed = true;
            ocrText = (data.text || "").replace(/[ \t]+/g, " ").trim();
            confidence = typeof data.confidence === "number" ? data.confidence : 0;
          } catch {
            ocrText = "";
            confidence = 0;
          }

          const combined = ocrText || text;
          const status: PageStatus = !combined.trim()
            ? "failed"
            : confidence && confidence < OCR_CONFIDENCE_MIN
              ? "low-confidence"
              : "ocr";
          entry = {
            page: i,
            status,
            text: combined,
            confidence: confidence || null,
            thumbnail: status === "ocr" ? null : thumbnail,
          };
        }
      } catch {
        entry = { page: i, status: "failed", text: "", confidence: null, thumbnail: null };
      }
      pages.push(entry);
    }

    if (worker) await (worker as OcrWorker).terminate().catch(() => undefined);
  } catch {
    // Whole-document failure: report a single failed page so the UI can react.
    if (pages.length === 0) {
      pages.push({ page: 1, status: "failed", text: "", confidence: null, thumbnail: null });
    }
  }

  return {
    text: joinPages(pages),
    pages,
    needsReview: pages.filter((p) => p.status === "failed" || p.status === "low-confidence"),
    ocrUsed,
  };
}

/** Extract plain text from a PDF file in the browser. Returns "" on failure. */
export async function extractPdfText(file: File | Blob): Promise<string> {
  const detailed = await extractPdfDetailed(file);
  return detailed.text;
}

/** Text-layer-only extraction (no OCR). Returns "" on failure. */
export async function extractPdfTextLayer(file: File | Blob): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages: string[] = [];
    const limit = Math.min(pdf.numPages, 40);
    for (let i = 1; i <= limit; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) pages.push(text);
    }
    return pages.join("\n\n").slice(0, 200_000);
  } catch {
    return "";
  }
}
