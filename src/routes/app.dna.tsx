import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { getDna, type DnaRow } from "@/lib/dna.functions";

export const Route = createFileRoute("/app/dna")({
  head: () => ({
    meta: [
      { title: "Career DNA — CareerPilot AI" },
      { name: "description", content: "Your evolving profile of strengths, skills, interests, values, and learning style." },
    ],
  }),
  component: DnaPage,
});

function DnaPage() {
  const [dna, setDna] = useState<DnaRow | null>(null);

  useEffect(() => {
    const d = getDeviceId();
    getDna({ data: { deviceId: d } }).then(setDna);
  }, []);

  if (!dna) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const empty =
    dna.strengths.length +
      dna.skills.length +
      dna.interests.length +
      dna.core_values.length ===
    0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">Career DNA</h1>
      </div>

      <p className="mb-8 text-sm text-muted-foreground">
        Automatically extracted from your Soaria conversations and uploaded documents.
        {dna.source_count > 0 && (
          <> Built from {dna.source_count} signals. Last updated {new Date(dna.updated_at).toLocaleString()}.</>
        )}
      </p>

      {empty && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          Your DNA is empty. Start a conversation with Soaria or upload a document — signals get added automatically.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Strengths" items={dna.strengths} />
        <Card title="Skills" items={dna.skills} />
        <Card title="Interests" items={dna.interests} />
        <Card title="Core values" items={dna.core_values} />
      </div>

      {Object.keys(dna.learning_style).length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Learning style</p>
          <dl className="grid gap-2 text-sm">
            {Object.entries(dna.learning_style).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-border/40 py-1">
                <dt className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}</dt>
                <dd className="text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs capitalize text-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
