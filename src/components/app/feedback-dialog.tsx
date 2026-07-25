import { useState } from "react";
import { Loader2, Sparkles, Star, X } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback } from "@/lib/feedback.functions";

const FEATURES = [
  "Soaria chat",
  "Career DNA",
  "Career Readiness",
  "Documents",
  "Reflection Corner",
  "Dashboard",
  "Something else",
];

export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const [overall, setOverall] = useState<number | null>(null);
  const [ease, setEase] = useState<number | null>(null);
  const [ai, setAi] = useState<"yes" | "sometimes" | "no" | null>(null);
  const [feature, setFeature] = useState<string>("");
  const [issues, setIssues] = useState("");
  const [wishes, setWishes] = useState("");
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await submitFeedback({
        data: {
          overallRating: overall,
          easeRating: ease,
          aiUseful: ai,
          mostHelpfulFeature: feature || null,
          issues: issues.trim() || null,
          wishes: wishes.trim() || null,
          comments: comments.trim() || null,
        },
      });
      toast.success("Thank you — your feedback helps us grow.");
      onClose();
    } catch (err) {
      toast.error("Couldn't send feedback. Please try again.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 px-3 py-4 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="max-h-[85vh] overflow-y-auto px-6 pb-6 pt-7 md:px-8 md:pt-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent-foreground/70">
            <Sparkles className="h-3.5 w-3.5" /> Optional · 60 seconds
          </div>
          <h2 id="feedback-title" className="mt-2 font-display text-2xl font-semibold text-foreground">
            How was your session?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Anonymous, skippable, and only used to improve CareerPilot AI.
          </p>

          <div className="mt-6 space-y-5">
            <Field label="Overall satisfaction">
              <StarRow value={overall} onChange={setOverall} />
            </Field>

            <Field label="How easy was the app to use?">
              <StarRow value={ease} onChange={setEase} />
            </Field>

            <Field label="Were Soaria's answers useful and accurate?">
              <div className="flex flex-wrap gap-2">
                {(["yes", "sometimes", "no"] as const).map((v) => (
                  <Chip key={v} active={ai === v} onClick={() => setAi(v)}>
                    {v === "yes" ? "Yes" : v === "sometimes" ? "Sometimes" : "Not really"}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label="Which feature helped you most?">
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((f) => (
                  <Chip key={f} active={feature === f} onClick={() => setFeature(f)}>
                    {f}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label="Any bugs, errors or issues?">
              <textarea
                value={issues}
                onChange={(e) => setIssues(e.target.value.slice(0, 2000))}
                rows={2}
                placeholder="Optional"
                className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/30 focus:ring-2"
              />
            </Field>

            <Field label="Features you'd love to see next">
              <textarea
                value={wishes}
                onChange={(e) => setWishes(e.target.value.slice(0, 2000))}
                rows={2}
                placeholder="Optional"
                className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/30 focus:ring-2"
              />
            </Field>

            <Field label="Anything else?">
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value.slice(0, 2000))}
                rows={2}
                placeholder="Optional"
                className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/30 focus:ring-2"
              />
            </Field>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function StarRow({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value !== null && n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => onChange(n)}
            className="rounded-md p-1 transition hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${active ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
