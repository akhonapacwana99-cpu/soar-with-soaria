import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        overallRating: z.number().int().min(1).max(5).nullable().optional(),
        easeRating: z.number().int().min(1).max(5).nullable().optional(),
        aiUseful: z.enum(["yes", "sometimes", "no"]).nullable().optional(),
        mostHelpfulFeature: z.string().max(120).nullable().optional(),
        issues: z.string().max(2000).nullable().optional(),
        wishes: z.string().max(2000).nullable().optional(),
        comments: z.string().max(2000).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./db.server");
    // Fully anonymous — no device_id, no headers, no IP stored.
    const { error } = await getDb().from("feedback").insert({
      overall_rating: data.overallRating ?? null,
      ease_rating: data.easeRating ?? null,
      ai_useful: data.aiUseful ?? null,
      most_helpful_feature: data.mostHelpfulFeature ?? null,
      issues: data.issues ?? null,
      wishes: data.wishes ?? null,
      comments: data.comments ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
