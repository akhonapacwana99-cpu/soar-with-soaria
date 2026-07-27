import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DeviceOnly = z.object({ deviceId: z.string().min(1) });

/** Full export of everything stored for this device. */
export const exportDeviceData = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeviceOnly.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const id = data.deviceId;

    const [threads, messages, folders, documents, reflections, dna] = await Promise.all([
      db.from("chat_threads").select("*").eq("device_id", id),
      db.from("chat_messages").select("*").eq("device_id", id),
      db.from("doc_folders").select("*").eq("device_id", id),
      db
        .from("documents")
        .select("id, folder_id, name, mime, size, summary, extracted_text, created_at")
        .eq("device_id", id),
      db.from("reflections").select("*").eq("device_id", id),
      db.from("career_dna").select("*").eq("device_id", id).maybeSingle(),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      deviceId: id,
      threads: threads.data ?? [],
      messages: messages.data ?? [],
      folders: folders.data ?? [],
      documents: documents.data ?? [],
      reflections: reflections.data ?? [],
      careerDna: dna.data ?? null,
    };
  });

/** Permanently deletes every row (and stored file) tied to this device. */
export const deleteDeviceData = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeviceOnly.parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const id = data.deviceId;

    const { data: docs } = await db
      .from("documents")
      .select("storage_path")
      .eq("device_id", id);
    const paths = (docs ?? []).map((d) => d.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await db.storage.from("documents").remove(paths);
    }

    await db.from("chat_messages").delete().eq("device_id", id);
    await db.from("chat_threads").delete().eq("device_id", id);
    await db.from("documents").delete().eq("device_id", id);
    await db.from("doc_folders").delete().eq("device_id", id);
    await db.from("reflections").delete().eq("device_id", id);
    await db.from("career_dna").delete().eq("device_id", id);

    return { ok: true };
  });
