import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ReadinessDim = { key: string; label: string; score: number; hint: string };
export type Readiness = { total: number; dimensions: ReadinessDim[]; nextActions: string[] };

export const computeReadiness = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ deviceId: z.string() }).parse(d))
  .handler(async ({ data }): Promise<Readiness> => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const [dna, docs, threads, reflections] = await Promise.all([
      db.from("career_dna").select("*").eq("device_id", data.deviceId).maybeSingle(),
      db.from("documents").select("id, summary, mime").eq("device_id", data.deviceId),
      db.from("chat_threads").select("id").eq("device_id", data.deviceId),
      db.from("reflections").select("id").eq("device_id", data.deviceId),
    ]);

    const dnaRow = dna.data;
    const dnaCount =
      ((dnaRow?.strengths as unknown[]) ?? []).length +
      ((dnaRow?.skills as unknown[]) ?? []).length +
      ((dnaRow?.interests as unknown[]) ?? []).length +
      ((dnaRow?.core_values as unknown[]) ?? []).length;
    const docList = docs.data ?? [];
    const summarized = docList.filter((d) => d.summary).length;
    const cvUploaded = docList.some((d) => /cv|resume/i.test(d.mime) || docList.length > 0);

    const dims: ReadinessDim[] = [
      {
        key: "profile",
        label: "Career DNA depth",
        score: Math.min(100, dnaCount * 8),
        hint: "Chat more with Soaria and upload documents to enrich your DNA.",
      },
      {
        key: "documents",
        label: "Document readiness",
        score: Math.min(100, docList.length * 20 + summarized * 15),
        hint: "Upload your CV and cover letter, then run Summarize on each.",
      },
      {
        key: "conversation",
        label: "Coaching engagement",
        score: Math.min(100, (threads.data?.length ?? 0) * 15),
        hint: "Start regular conversations with Soaria to build momentum.",
      },
      {
        key: "reflection",
        label: "Reflection & clarity",
        score: Math.min(100, (reflections.data?.length ?? 0) * 12),
        hint: "Journal 2–3 short reflections per week to strengthen self-awareness.",
      },
      {
        key: "assets",
        label: "Core assets",
        score: cvUploaded ? 60 : 0,
        hint: "Upload a CV in Document Workspace to unlock CV analysis.",
      },
    ];

    const total = Math.round(dims.reduce((a, d) => a + d.score, 0) / dims.length);
    const nextActions = dims
      .filter((d) => d.score < 60)
      .slice(0, 4)
      .map((d) => `${d.label}: ${d.hint}`);

    return { total, dimensions: dims, nextActions };
  });
