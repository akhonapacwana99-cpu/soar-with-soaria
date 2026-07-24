import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DeviceOnly = z.object({ deviceId: z.string().min(1) });

export const listThreads = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeviceOnly.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: rows, error } = await getDb()
      .from("chat_threads")
      .select("id, title, created_at, updated_at")
      .eq("device_id", data.deviceId)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string().min(1), title: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: row, error } = await getDb()
      .from("chat_threads")
      .insert({ device_id: data.deviceId, title: data.title ?? "New conversation" })
      .select("id, title, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const renameThread = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), id: z.string(), title: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { error } = await getDb()
      .from("chat_threads")
      .update({ title: data.title, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("device_id", data.deviceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), id: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { error } = await getDb()
      .from("chat_threads")
      .delete()
      .eq("id", data.id)
      .eq("device_id", data.deviceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), threadId: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: rows, error } = await getDb()
      .from("chat_messages")
      .select("id, role, content, parts, created_at")
      .eq("thread_id", data.threadId)
      .eq("device_id", data.deviceId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const searchMessages = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), q: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: rows, error } = await getDb()
      .from("chat_messages")
      .select("id, thread_id, role, content, created_at")
      .eq("device_id", data.deviceId)
      .ilike("content", `%${data.q}%`)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
