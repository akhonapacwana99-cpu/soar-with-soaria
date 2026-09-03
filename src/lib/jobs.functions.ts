import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type JobPosting = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  postedAt: string | null;
  description: string;
};

// Strips HTML from feed descriptions so the ATS comparison sees clean text.
function toText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json", "User-Agent": "CareerPilotAI/1.0" },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/**
 * Live job postings from public, key-less job feeds (Remotive and Arbeitnow).
 * Descriptions are returned as plain text so the ATS Checker can score a CV
 * against a real advert instead of generic best-practice criteria.
 */
export const searchJobs = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        query: z.string().min(2).max(120),
        location: z.string().max(80).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ jobs: JobPosting[]; warning?: string }> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const q = data.query.trim();
    const loc = data.location.trim().toLowerCase();

    const remotive = async (): Promise<JobPosting[]> => {
      const j = (await getJson(
        `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=20`,
        controller.signal,
      )) as {
        jobs?: Array<{
          id?: number;
          title?: string;
          company_name?: string;
          candidate_required_location?: string;
          url?: string;
          publication_date?: string;
          description?: string;
        }>;
      };
      return (j.jobs ?? []).map((r) => ({
        id: `remotive-${r.id}`,
        title: r.title ?? "Untitled role",
        company: r.company_name ?? "Unknown company",
        location: r.candidate_required_location ?? "Remote",
        url: r.url ?? "",
        source: "Remotive",
        postedAt: r.publication_date ?? null,
        description: toText(r.description ?? "").slice(0, 12000),
      }));
    };

    const arbeitnow = async (): Promise<JobPosting[]> => {
      const j = (await getJson("https://www.arbeitnow.com/api/job-board-api", controller.signal)) as {
        data?: Array<{
          slug?: string;
          title?: string;
          company_name?: string;
          location?: string;
          url?: string;
          created_at?: number;
          description?: string;
        }>;
      };
      const needle = q.toLowerCase();
      return (j.data ?? [])
        .filter(
          (r) =>
            (r.title ?? "").toLowerCase().includes(needle) ||
            (r.description ?? "").toLowerCase().includes(needle),
        )
        .slice(0, 20)
        .map((r) => ({
          id: `arbeitnow-${r.slug}`,
          title: r.title ?? "Untitled role",
          company: r.company_name ?? "Unknown company",
          location: r.location ?? "",
          url: r.url ?? "",
          source: "Arbeitnow",
          postedAt: r.created_at ? new Date(r.created_at * 1000).toISOString() : null,
          description: toText(r.description ?? "").slice(0, 12000),
        }));
    };

    try {
      const settled = await Promise.allSettled([remotive(), arbeitnow()]);
      const jobs = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
      const failed = settled.filter((s) => s.status === "rejected").length;
      const filtered = loc
        ? jobs.filter((j) => `${j.location} ${j.title}`.toLowerCase().includes(loc))
        : jobs;
      const list = (filtered.length > 0 ? filtered : jobs)
        .filter((j) => j.description.length > 120)
        .slice(0, 25);
      if (list.length === 0) {
        return { jobs: [], warning: "No live postings matched that search. Try a broader job title." };
      }
      return {
        jobs: list,
        ...(failed > 0 ? { warning: "One job source was unavailable, so results may be limited." } : {}),
      };
    } catch {
      return { jobs: [], warning: "Live job search is unavailable right now. You can still paste an advert." };
    } finally {
      clearTimeout(timer);
    }
  });
