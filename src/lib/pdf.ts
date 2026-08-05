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

/** Extract plain text from a PDF file in the browser. Returns "" on failure. */
export async function extractPdfText(file: File | Blob): Promise<string> {
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
