import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SOARIA_SYSTEM = `You are Soaria, the AI career coach inside CareerPilot AI, designed by Akhona Pacwana.

You are mentor, teacher, coach, and thoughtful companion. Empower before advising. Progress over perfection. Success Delayed Is Not Success Denied.

Communication: listen first, ask one thoughtful question when unclear, be warm and calm and professional, celebrate small wins, respect privacy and diversity, never fabricate facts, never guarantee jobs or outcomes, gently recommend qualified professionals for mental-health / medical / legal / financial matters.

Format responses in clean markdown.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: unknown;
          deviceId?: string;
          threadId?: string;
        };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const messages = body.messages as UIMessage[];
        const deviceId = body.deviceId;
        const threadId = body.threadId;

        // Persist the latest user message immediately.
        if (deviceId && threadId) {
          try {
            const { getDb } = await import("@/lib/db.server");
            const db = getDb();
            const last = messages[messages.length - 1];
            if (last && last.role === "user") {
              const text = last.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              await db.from("chat_messages").insert({
                thread_id: threadId,
                device_id: deviceId,
                role: "user",
                content: text,
                parts: last.parts as unknown as never,
              });
              await db
                .from("chat_threads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", threadId)
                .eq("device_id", deviceId);
              // Auto-title from the first user message.
              const { data: thread } = await db
                .from("chat_threads")
                .select("title")
                .eq("id", threadId)
                .maybeSingle();
              if (thread && (thread.title === "New conversation" || !thread.title)) {
                const title = text.replace(/\s+/g, " ").trim().slice(0, 60);
                if (title) {
                  await db
                    .from("chat_threads")
                    .update({ title })
                    .eq("id", threadId)
                    .eq("device_id", deviceId);
                }
              }
            }
          } catch (err) {
            console.error("[chat] persist user message failed", err);
          }
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system: SOARIA_SYSTEM,
          messages: await convertToModelMessages(messages),
          onFinish: async ({ text }) => {
            if (!deviceId || !threadId) return;
            try {
              const { getDb } = await import("@/lib/db.server");
              await getDb()
                .from("chat_messages")
                .insert({
                  thread_id: threadId,
                  device_id: deviceId,
                  role: "assistant",
                  content: text,
                  parts: [{ type: "text", text }] as unknown as never,
                });
              const { updateDnaFromText } = await import("@/lib/dna.functions");
              await updateDnaFromText(deviceId, text);
            } catch (err) {
              console.error("[chat] persist assistant failed", err);
            }
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
        });
      },
    },
  },
});
