import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ResumeProfile = {
  target_role: string;
  contact: string;
  experience: string;
  education: string;
  skills: string;
  extras: string;
  updated_at?: string;
};

const EMPTY: ResumeProfile = {
  target_role: "",
  contact: "",
  experience: "",
  education: "",
  skills: "",
  extras: "",
};

const profileSchema = z.object({
  target_role: z.string().max(200).default(""),
  contact: z.string().max(2000).default(""),
  experience: z.string().max(20000).default(""),
  education: z.string().max(5000).default(""),
  skills: z.string().max(5000).default(""),
  extras: z.string().max(5000).default(""),
});

export const getResumeProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ deviceId: z.string().min(1) }).parse(d))
  .handler(async ({ data }): Promise<ResumeProfile> => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const { data: row } = await db
      .from("resume_profiles")
      .select("target_role, contact, experience, education, skills, extras, updated_at")
      .eq("device_id", data.deviceId)
      .maybeSingle();
    if (row) return row as ResumeProfile;

    // No saved resume yet — seed a first draft from the real data we already
    // hold for this device: Career DNA skills/strengths and the most recent
    // uploaded CV text. This is what makes the builder start with real job
    // titles and skills instead of placeholder copy.
    const [{ data: dna }, { data: docs }] = await Promise.all([
      db
        .from("career_dna")
        .select("skills, strengths, interests")
        .eq("device_id", data.deviceId)
        .maybeSingle(),
      db
        .from("documents")
        .select("name, extracted_text")
        .eq("device_id", data.deviceId)
        .not("extracted_text", "is", null)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    const asList = (v: unknown) =>
      Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(", ") : "";

    const doc = docs?.[0];
    return {
      ...EMPTY,
      skills: [asList(dna?.skills), asList(dna?.strengths)].filter(Boolean).join(", ").slice(0, 4000),
      experience: (doc?.extracted_text ?? "").slice(0, 12000),
    };
  });

export const saveResumeProfile = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string().min(1), profile: profileSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { error } = await getDb()
      .from("resume_profiles")
      .upsert({ device_id: data.deviceId, ...data.profile }, { onConflict: "device_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
