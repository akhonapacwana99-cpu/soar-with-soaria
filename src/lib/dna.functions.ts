import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DeviceOnly = z.object({ deviceId: z.string().min(1) });

export type DnaRow = {
  device_id: string;
  strengths: string[];
  skills: string[];
  interests: string[];
  core_values: string[];
  learning_style: Record<string, string>;
  source_count: number;
  updated_at: string;
};

const EMPTY: DnaRow = {
  device_id: "",
  strengths: [],
  skills: [],
  interests: [],
  core_values: [],
  learning_style: {},
  source_count: 0,
  updated_at: new Date().toISOString(),
};

function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
}

export const getDna = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeviceOnly.parse(d))
  .handler(async ({ data }): Promise<DnaRow> => {
    const { getDb } = await import("./db.server");
    const { data: row } = await getDb()
      .from("career_dna")
      .select("*")
      .eq("device_id", data.deviceId)
      .maybeSingle();
    if (!row) return { ...EMPTY, device_id: data.deviceId };
    return {
      device_id: row.device_id,
      strengths: toArr(row.strengths),
      skills: toArr(row.skills),
      interests: toArr(row.interests),
      core_values: toArr(row.core_values),
      learning_style: toStringMap(row.learning_style),
      source_count: row.source_count ?? 0,
      updated_at: row.updated_at,
    };
  });

function toStringMap(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string") out[k] = val;
    else if (val != null) out[k] = String(val);
  }
  return out;
}

async function extractSignals(text: string): Promise<Partial<DnaRow> | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key || !text.trim()) return null;
  const prompt = `From the text below, extract concise career signals as JSON with keys "strengths", "skills", "interests", "core_values" (each an array of 1-6 short lowercase phrases, max 3 words each) and "learning_style" (object with keys like modality, pace, environment — omit if unclear). Return ONLY JSON. If nothing signal-worthy, return {"strengths":[],"skills":[],"interests":[],"core_values":[],"learning_style":{}}.

TEXT:
"""${text.slice(0, 6000)}"""`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = j.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      strengths: toArr(parsed.strengths),
      skills: toArr(parsed.skills),
      interests: toArr(parsed.interests),
      core_values: toArr(parsed.core_values),
      learning_style: toStringMap(parsed.learning_style),
    };
  } catch {
    return null;
  }
}

function mergeUnique(a: string[], b: string[], cap = 24): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of [...a, ...b]) {
    const k = v.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= cap) break;
  }
  return out;
}

export async function updateDnaFromText(deviceId: string, text: string): Promise<void> {
  const signals = await extractSignals(text);
  if (!signals) return;
  const { getDb } = await import("./db.server");
  const db = getDb();
  const { data: existing } = await db
    .from("career_dna")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();
  const merged = {
    device_id: deviceId,
    strengths: mergeUnique(toArr(existing?.strengths), signals.strengths ?? []),
    skills: mergeUnique(toArr(existing?.skills), signals.skills ?? []),
    interests: mergeUnique(toArr(existing?.interests), signals.interests ?? []),
    core_values: mergeUnique(toArr(existing?.core_values), signals.core_values ?? []),
    learning_style: {
      ...toStringMap(existing?.learning_style),
      ...(signals.learning_style ?? {}),
    } as Record<string, string>,
    source_count: (existing?.source_count ?? 0) + 1,
    updated_at: new Date().toISOString(),
  };
  await db.from("career_dna").upsert(merged, { onConflict: "device_id" });
}

export const ingestDnaFromText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), text: z.string().min(20) }).parse(d),
  )
  .handler(async ({ data }) => {
    await updateDnaFromText(data.deviceId, data.text);
    return { ok: true };
  });
