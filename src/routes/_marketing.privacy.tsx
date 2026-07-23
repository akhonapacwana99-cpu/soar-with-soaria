import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_marketing/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — CareerPilot AI" },
      { name: "description", content: "How CareerPilot AI handles your data and respects your privacy." },
      { property: "og:title", content: "Privacy — CareerPilot AI" },
      { property: "og:description", content: "Privacy-first, responsible AI." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Privacy</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">Privacy Policy</h1>
      <div className="prose prose-neutral mt-8 max-w-none text-muted-foreground [&_h2]:font-display [&_h2]:text-foreground [&_h2]:mt-8">
        <p>CareerPilot AI is built on responsible AI principles. This is a placeholder policy that will be replaced with the full legal text prior to launch.</p>
        <h2>What we collect</h2>
        <p>Only the information you choose to share with Soaria and the documents you create. Conversations remain in your browser unless you explicitly opt in to cloud sync.</p>
        <h2>What we don't do</h2>
        <p>We don't sell your data. We don't use your private conversations to advertise to you. We don't guarantee outcomes.</p>
        <h2>Contact</h2>
        <p>Questions? Reach us via the <a href="/contact">contact page</a>.</p>
      </div>
    </div>
  ),
});
