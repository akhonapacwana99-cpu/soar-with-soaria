import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing/reflection")({
  head: () => ({
    meta: [
      { title: "Reflection Corner — CareerPilot AI" },
      { name: "description", content: "A dedicated space for mindfulness, journaling, and featured original poetry by Sonwabile The Poet." },
      { property: "og:title", content: "Reflection Corner — CareerPilot AI" },
      { property: "og:description", content: "Beyond The Silence. Within The Silence. Poems and prompts to help you pause and grow." },
    ],
  }),
  component: ReflectionPage,
});

const poems = [
  {
    title: "Beyond The Silence",
    author: "Sonwabile The Poet",
    body: `Beyond the silence, a whisper waits —
soft as dawn, patient as stone.
Not every calling arrives with thunder;
some are the quiet turning of a page.

Keep listening. What you seek
is also seeking you.`,
  },
  {
    title: "Within The Silence",
    author: "Sonwabile The Poet",
    body: `Within the silence, a self is being made —
gathered piece by piece from ordinary days.
The hours you thought were empty
were shaping the person you are becoming.

Do not rush the rising.
Even the sun takes its time.`,
  },
];

function ReflectionPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-20 md:px-8 md:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Reflection Corner</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
        Pause. Reflect. Rise.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        A quiet space inside CareerPilot for mindfulness, journaling, and honest self-reflection.
        Growth isn't only forward motion — sometimes it's the stillness that lets us hear where
        we're going.
      </p>

      <div className="mt-14 space-y-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Featured poetry</p>
        {poems.map((p) => (
          <article
            key={p.title}
            className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-emerald-brand/[0.04] p-8 shadow-elegant md:p-12"
          >
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">{p.title}</h2>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">— {p.author}</p>
            <pre className="mt-6 whitespace-pre-wrap font-display text-lg italic leading-relaxed text-foreground md:text-xl">
{p.body}
            </pre>
          </article>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        <p>
          Poems are curated works featured for reflection. If you would like to submit or replace
          the featured text, get in touch via the <a href="/contact" className="font-medium text-foreground underline">contact page</a>.
        </p>
      </div>
    </div>
  );
}
