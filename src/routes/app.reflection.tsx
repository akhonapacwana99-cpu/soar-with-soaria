import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/device-id";
import { addReflection, listReflections } from "@/lib/reflections.functions";

export const Route = createFileRoute("/app/reflection")({
  head: () => ({
    meta: [
      { title: "Reflection Corner — CareerPilot AI" },
      { name: "description", content: "Daily reflections, mood check-ins, and journaling prompts." },
    ],
  }),
  component: ReflectionPage,
});

const PROMPTS = [
  "What is one small win you noticed today?",
  "What is quietly weighing on you right now?",
  "Which value did you honor this week — and which did you set aside?",
  "If tomorrow you took one honest step forward, what would it be?",
  "When did you feel most alive this month, and why?",
  "What are you learning that yesterday's version of you would be proud of?",
  "What is the story you keep telling yourself — is it still true?",
];

const MOODS = [
  { v: 1, label: "Low" },
  { v: 2, label: "Meh" },
  { v: 3, label: "Steady" },
  { v: 4, label: "Warm" },
  { v: 5, label: "Bright" },
];

type Entry = { id: string; mood: number | null; prompt: string | null; entry: string; created_at: string };

function ReflectionPage() {
  const [deviceId, setDeviceId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mood, setMood] = useState(3);
  const [entry, setEntry] = useState("");
  const [busy, setBusy] = useState(false);

  const todayPrompt = useMemo(() => {
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return PROMPTS[day % PROMPTS.length];
  }, []);

  useEffect(() => {
    const d = getDeviceId();
    setDeviceId(d);
    listReflections({ data: { deviceId: d } }).then(setEntries);
  }, []);

  const save = async () => {
    if (!entry.trim()) return;
    setBusy(true);
    try {
      const row = await addReflection({
        data: { deviceId, mood, prompt: todayPrompt, entry: entry.trim() },
      });
      setEntries((prev) => [row, ...prev]);
      setEntry("");
      toast.success("Reflection saved");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Heart className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-semibold text-foreground md:text-4xl">Reflection Corner</h1>
      </div>

      <section className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-emerald-brand/[0.05] p-6 shadow-elegant md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Prompt of the day</p>
        <p className="mt-2 font-display text-2xl leading-snug text-foreground md:text-3xl">"{todayPrompt}"</p>

        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">How are you today?</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.v}
                onClick={() => setMood(m.v)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  mood === m.v
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          rows={5}
          placeholder="Write freely. Nothing here is graded."
          className="mt-5 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none ring-ring/30 focus:ring-2"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">Your entries stay in this browser only.</p>
          <button
            onClick={save}
            disabled={busy || !entry.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Save reflection
          </button>
        </div>
      </section>

      <section className="mt-10">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Past reflections</p>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reflections yet. Today's a good day to start.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <article key={e.id} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                  {typeof e.mood === "number" && ` · ${MOODS.find((m) => m.v === e.mood)?.label}`}
                </p>
                {e.prompt && <p className="mt-1 text-sm italic text-muted-foreground">"{e.prompt}"</p>}
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{e.entry}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        Looking for the featured poems by Sonwabile The Poet?{" "}
        <Link to="/reflection" className="font-medium text-foreground underline">
          Read them here →
        </Link>
      </div>
    </div>
  );
}
