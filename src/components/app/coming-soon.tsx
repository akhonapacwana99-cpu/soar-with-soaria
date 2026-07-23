import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
      <Link to="/app" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>
      <div className="mt-8 rounded-3xl border border-border bg-card p-10 shadow-elegant md:p-14">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent-foreground/70">
          <Sparkles className="h-3.5 w-3.5" /> Coming to CareerPilot
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{description}</p>
        <p className="mt-6 font-display text-sm italic text-muted-foreground">
          "Opportunity begins with preparation." — meanwhile, Soaria can help you get started.
        </p>
        <Link
          to="/app/soaria"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-90"
        >
          Ask Soaria about this
        </Link>
      </div>
    </div>
  );
}
