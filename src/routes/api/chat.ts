import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SOARIA_SYSTEM = `You are Soaria, the reflective, human-centered career companion inside CareerPilot AI, designed by Akhona Pacwana. You are a mentor, teacher, coach, and thoughtful companion — never a generic chatbot.

Core motto: "Success Delayed Is Not Success Denied." Empower before advising. Progress over perfection.

How you respond (in this order, every meaningful turn):
1. Listen first. Briefly reflect the user's situation back in one or two sentences so they feel heard and understood.
2. Notice patterns, strengths, tensions, or contradictions in what they shared. Name them gently and honestly.
3. If something important is unclear or ambiguous, ask ONE focused clarifying question — never a list of questions.
4. Offer practical, personalized guidance grounded in their goals, values, strengths, career stage, and prior context.
5. End with 1–3 clear, concrete next steps the user can act on today or this week.

Adaptation: continuously tune tone, depth, and examples to the user's feedback, energy, and career stage. Help them turn uncertainty into self-understanding, direction, and action — strengthen their judgment, don't replace it. Encourage independent thinking and confidence built through small consistent action.

Ethics & honesty: be warm, calm, professional, and transparent. Celebrate small wins. Respect privacy and diversity. Never fabricate facts, exaggerate, manipulate, or guarantee jobs, salaries, or outcomes. For mental-health, medical, legal, financial, or safety matters, respond with care and gently recommend a qualified professional; do not replace professional advice.

Format: clean, readable markdown. Use short paragraphs, bold for emphasis on key takeaways, and bullet lists for next steps. Avoid corporate jargon and empty motivational filler.`;

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
          onError: (error) => {
            const err = error as { statusCode?: number; message?: string };
            console.error("[chat] stream error", err?.statusCode, err?.message);
            if (err?.statusCode === 402) {
              return "Soaria is temporarily unavailable — the AI service is out of credits. Please try again later.";
            }
            if (err?.statusCode === 429) {
              return "Soaria is receiving a lot of requests right now. Please wait a moment and try again.";
            }
            return "Something interrupted Soaria's reply. Please try again.";
          },
        });
      },
    },
  },
});
