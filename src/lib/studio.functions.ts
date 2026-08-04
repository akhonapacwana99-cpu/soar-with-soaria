import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TOOL_PROMPTS: Record<string, string> = {
  cv: `You are Soaria, an expert CV writer and recruiter. Produce a complete, ATS-friendly CV in clean markdown.
Rules: no tables, no columns, no graphics, no emojis. Use plain section headings (Professional Summary, Core Skills, Experience, Education, Projects, Certifications) only when there is real content for them.
Write achievement-led bullets that start with a strong verb and include measurable impact where the user gave numbers. Never invent employers, dates, qualifications or metrics that the user did not provide — if something is missing, leave a clearly marked [add detail] placeholder.`,
  "cover-letter": `You are Soaria, an expert cover-letter writer. Produce a tailored one-page cover letter in markdown.
Structure: greeting, a specific opening that shows why this role and company, two short body paragraphs mapping the user's real evidence to the role's needs, and a confident closing with a call to action. Warm, professional, no clichés, no flattery, under 350 words. Never invent facts.`,
  linkedin: `You are Soaria, a LinkedIn profile strategist. Return markdown with these sections:
## Headline options (3 options, each under 220 characters)
## About section (first-person, 3 short paragraphs, keyword-rich, ends with a call to action)
## Experience rewrite (achievement bullets for the roles provided)
## Skills to list (12 ranked keywords)
## Profile checklist (concrete actions to improve visibility)
Never invent facts.`,
  portfolio: `You are Soaria, a portfolio coach. Return markdown that plans a compelling portfolio:
## Positioning statement
## Recommended structure (page-by-page)
## Project case studies (for each project provided: Problem, Approach, Role, Result, What I'd do differently)
## Proof to gather
## Next steps
Never invent projects or results.`,
  email: `You are Soaria, a professional communication coach. Write the requested email in markdown.
Give a "Subject:" line, then the email body. Keep it concise, specific and courteous, matched to the requested tone. Then add a short "## Why this works" note (max 3 bullets). Never invent facts.`,
};

const TOOL_NAMES: Record<string, string> = {
  cv: "CV",
  "cover-letter": "Cover letter",
  linkedin: "LinkedIn profile",
  portfolio: "Portfolio plan",
  email: "Email",
};

async function callGateway(system: string, user: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (res.status === 429) throw new Error("Soaria is busy right now — please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits are exhausted. Please top up to keep generating.");
  if (!res.ok) throw new Error(`Soaria couldn't complete this (error ${res.status}). Please try again.`);
  const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = j.choices?.[0]?.message?.content;
  if (!text || !text.trim()) throw new Error("Soaria returned an empty result. Please try again.");
  return text;
}

async function contextFor(deviceId: string) {
  try {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const [{ data: dna }, { data: docs }] = await Promise.all([
      db.from("career_dna").select("*").eq("device_id", deviceId).maybeSingle(),
      db
        .from("documents")
        .select("name, summary")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);
    const parts: string[] = [];
    if (dna) parts.push(`Known Career DNA: ${JSON.stringify(dna).slice(0, 1500)}`);
    if (docs?.length)
      parts.push(
        `Recent document summaries:\n${docs
          .map((d) => `- ${d.name}: ${(d.summary ?? "").slice(0, 400)}`)
          .join("\n")}`,
      );
    return parts.join("\n\n");
  } catch {
    return "";
  }
}

export const generateDocument = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        deviceId: z.string().min(1),
        tool: z.enum(["cv", "cover-letter", "linkedin", "portfolio", "email"]),
        title: z.string().max(120).optional(),
        inputs: z.record(z.string(), z.string()).default({}),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const system = TOOL_PROMPTS[data.tool]!;
    const context = await contextFor(data.deviceId);
    const body = Object.entries(data.inputs)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}:\n${v.trim()}`)
      .join("\n\n");
    if (!body) throw new Error("Please fill in at least one field first.");
    const text = await callGateway(
      system,
      `${body}${context ? `\n\n---\nBackground you already know about this person (use only if relevant, never contradict what they typed):\n${context}` : ""}`,
    );

    const name = data.title?.trim() || `${TOOL_NAMES[data.tool]} — ${new Date().toLocaleDateString()}`;
    let id: string | null = null;
    try {
      const { getDb } = await import("./db.server");
      const { data: row } = await getDb()
        .from("documents")
        .insert({
          device_id: data.deviceId,
          name,
          mime: "text/markdown",
          size: text.length,
          storage_path: `generated/${data.tool}/${crypto.randomUUID()}.md`,
          extracted_text: text,
          summary: text.slice(0, 800),
        })
        .select("id")
        .single();
      id = row?.id ?? null;
    } catch {
      id = null;
    }
    return { id, name, text };
  });

export const scoreAts = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        deviceId: z.string().min(1),
        resume: z.string().min(30, "Paste your CV text first (at least a few lines)."),
        jobDescription: z.string().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const raw = await callGateway(
      `You are an applicant tracking system (ATS) auditor. Analyse the CV against the job description if provided, otherwise against general ATS best practice.
Respond with ONLY a JSON object, no markdown fences, matching exactly:
{"score":0-100,"verdict":"one sentence","categories":[{"name":"Keyword match","score":0-100,"note":"one sentence"}],"missingKeywords":["..."],"fixes":["specific actionable fix"]}
Include exactly these categories: Keyword match, Formatting & parseability, Impact & metrics, Structure & sections, Clarity & length. Give 5-10 missingKeywords and 4-8 fixes.`,
      `CV:\n${data.resume.slice(0, 12000)}\n\nJob description:\n${data.jobDescription.slice(0, 6000) || "(none provided)"}`,
    );
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const schema = z.object({
      score: z.number(),
      verdict: z.string(),
      categories: z.array(z.object({ name: z.string(), score: z.number(), note: z.string() })),
      missingKeywords: z.array(z.string()),
      fixes: z.array(z.string()),
    });
    try {
      const parsed = schema.parse(JSON.parse(cleaned));
      return {
        ...parsed,
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        categories: parsed.categories.map((c) => ({
          ...c,
          score: Math.max(0, Math.min(100, Math.round(c.score))),
        })),
      };
    } catch {
      throw new Error("Soaria couldn't read the analysis. Please try again.");
    }
  });

export const listGenerated = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string().min(1), tool: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: rows, error } = await getDb()
      .from("documents")
      .select("id, name, extracted_text, created_at")
      .eq("device_id", data.deviceId)
      .like("storage_path", `generated/${data.tool}/%`)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      text: r.extracted_text ?? "",
      created_at: r.created_at,
    }));
  });
