import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listReflections = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ deviceId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: rows, error } = await getDb()
      .from("reflections")
      .select("id, mood, prompt, entry, created_at")
      .eq("device_id", data.deviceId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addReflection = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        deviceId: z.string(),
        mood: z.number().int().min(1).max(5).nullable().optional(),
        prompt: z.string().max(500).nullable().optional(),
        entry: z.string().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: row, error } = await getDb()
      .from("reflections")
      .insert({
        device_id: data.deviceId,
        mood: data.mood ?? null,
        prompt: data.prompt ?? null,
        entry: data.entry,
      })
      .select("id, mood, prompt, entry, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
