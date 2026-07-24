import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, History as HistoryIcon, MessageCircle } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { listThreads, searchMessages } from "@/lib/chat.functions";

export const Route = createFileRoute("/app/history")({
  head: () => ({ meta: [{ title: "History — CareerPilot AI" }] }),
  component: HistoryPage,
});

type Thread = { id: string; title: string; updated_at: string };
type Hit = { id: string; thread_id: string; role: string; content: string; created_at: string };

function HistoryPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const d = getDeviceId();
    listThreads({ data: { deviceId: d } }).then(setThreads);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setHits(null);
      return;
    }
    setLoading(true);
    const d = getDeviceId();
    const t = setTimeout(async () => {
      const r = await searchMessages({ data: { deviceId: d, q } });
      setHits(r);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <HistoryIcon className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">History</h1>
      </div>
      <div className="relative mb-8">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search across every conversation…"
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none ring-ring/30 focus:ring-2"
        />
      </div>

      {hits ? (
        <section>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            {loading ? "Searching…" : `${hits.length} match${hits.length === 1 ? "" : "es"}`}
          </p>
          <div className="space-y-3">
            {hits.map((h) => (
              <Link
                key={h.id}
                to="/app/soaria/$threadId"
                params={{ threadId: h.thread_id }}
                className="block rounded-xl border border-border bg-card p-4 hover:border-accent"
              >
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {h.role} · {new Date(h.created_at).toLocaleString()}
                </p>
                <p className="mt-1 line-clamp-3 text-sm text-foreground">{h.content}</p>
              </Link>
            ))}
            {hits.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">No matches.</p>
            )}
          </div>
        </section>
      ) : (
        <section>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            All conversations
          </p>
          <div className="space-y-2">
            {threads.map((t) => (
              <Link
                key={t.id}
                to="/app/soaria/$threadId"
                params={{ threadId: t.id }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-accent"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(t.updated_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
            {threads.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No conversations yet.{" "}
                <Link to="/app/soaria" className="text-primary underline">Start one</Link>.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
