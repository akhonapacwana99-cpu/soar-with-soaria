import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listFolders = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ deviceId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: rows, error } = await getDb()
      .from("doc_folders")
      .select("id, name, created_at")
      .eq("device_id", data.deviceId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createFolder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), name: z.string().min(1).max(80) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: row, error } = await getDb()
      .from("doc_folders")
      .insert({ device_id: data.deviceId, name: data.name })
      .select("id, name, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listDocs = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), folderId: z.string().nullable().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    let q = getDb()
      .from("documents")
      .select("id, folder_id, name, mime, size, summary, created_at")
      .eq("device_id", data.deviceId)
      .order("created_at", { ascending: false });
    if (data.folderId) q = q.eq("folder_id", data.folderId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const registerDoc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        deviceId: z.string(),
        folderId: z.string().nullable().optional(),
        name: z.string(),
        mime: z.string(),
        size: z.number().int().nonnegative(),
        storagePath: z.string(),
        extractedText: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: row, error } = await getDb()
      .from("documents")
      .insert({
        device_id: data.deviceId,
        folder_id: data.folderId ?? null,
        name: data.name,
        mime: data.mime,
        size: data.size,
        storage_path: data.storagePath,
        extracted_text: data.extractedText ?? null,
      })
      .select("id, folder_id, name, mime, size, summary, created_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteDoc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), id: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const { data: doc } = await db
      .from("documents")
      .select("storage_path")
      .eq("id", data.id)
      .eq("device_id", data.deviceId)
      .maybeSingle();
    if (doc?.storage_path) await db.storage.from("documents").remove([doc.storage_path]);
    const { error } = await db
      .from("documents")
      .delete()
      .eq("id", data.id)
      .eq("device_id", data.deviceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const summarizeDoc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), id: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const db = getDb();
    const { data: doc, error } = await db
      .from("documents")
      .select("id, name, extracted_text")
      .eq("id", data.id)
      .eq("device_id", data.deviceId)
      .single();
    if (error || !doc) throw new Error("Document not found");
    const text = (doc.extracted_text ?? "").slice(0, 8000);
    if (!text.trim()) {
      const summary = "No readable text was extracted from this file. Try uploading as .txt, .md, or paste the content.";
      await db.from("documents").update({ summary }).eq("id", doc.id);
      return { summary };
    }
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "You are Soaria, a career coach. Summarize the user's document in clean markdown: a 2-sentence overview, then bullet lists titled Strengths, Key experience, Skills, and Suggestions. Keep it under 300 words.",
          },
          { role: "user", content: `File: ${doc.name}\n\n${text}` },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const j = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const summary = j.choices?.[0]?.message?.content ?? "No summary produced.";
    await db.from("documents").update({ summary }).eq("id", doc.id);
    // Fire and forget DNA update.
    try {
      const { updateDnaFromText } = await import("./dna.functions");
      await updateDnaFromText(data.deviceId, `${doc.name}\n\n${text}`);
    } catch {
      // ignore
    }
    return { summary };
  });

export const getDocText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ deviceId: z.string(), id: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { data: row, error } = await getDb()
      .from("documents")
      .select("name, extracted_text, summary")
      .eq("id", data.id)
      .eq("device_id", data.deviceId)
      .single();
    if (error || !row) throw new Error("Document not found");
    return {
      name: row.name,
      text: row.extracted_text ?? row.summary ?? "",
    };
  });

export const updateDocText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ deviceId: z.string(), id: z.string(), extractedText: z.string().max(200_000) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    const { error } = await getDb()
      .from("documents")
      .update({ extracted_text: data.extractedText })
      .eq("id", data.id)
      .eq("device_id", data.deviceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
