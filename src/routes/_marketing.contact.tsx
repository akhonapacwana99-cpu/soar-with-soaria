import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/_marketing/contact")({
  head: () => ({
    meta: [
      { title: "Contact — CareerPilot AI" },
      { name: "description", content: "Get in touch with the CareerPilot AI team." },
      { property: "og:title", content: "Contact — CareerPilot AI" },
      { property: "og:description", content: "We would love to hear from you." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-foreground/70">Contact</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-foreground md:text-5xl">Let's talk.</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Partnerships, feedback, or a story to share — we'd love to hear from you.
      </p>

      <form
        className="mt-12 space-y-4 rounded-2xl border border-border bg-card p-6 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          alert("Thank you! Contact functionality will be connected soon.");
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Name</span>
            <input required className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/30 focus:ring-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input type="email" required className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/30 focus:ring-2" />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Message</span>
          <textarea required rows={5} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/30 focus:ring-2" />
        </label>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-90">
          <Mail className="h-4 w-4" /> Send message
        </button>
      </form>
    </div>
  );
}
