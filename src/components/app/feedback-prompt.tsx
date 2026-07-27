import { useEffect, useState } from "react";
import { MessageSquareHeart, X } from "lucide-react";
import { FeedbackDialog } from "./feedback-dialog";
import { loadPreferences } from "@/lib/preferences";

const STORAGE_KEY = "careerpilot:feedback:v1";
const IDLE_MS = 4 * 60 * 1000; // 4 minutes of activity within the app
const DAY_MS = 1000 * 60 * 60 * 24;
const COOLDOWNS = { normal: DAY_MS * 14, rare: DAY_MS * 90, never: Infinity } as const;
const DISMISSED = "dismissed";
const SUBMITTED = "submitted";


type State = { status?: string; lastAt?: number };

function read(): State {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as State;
  } catch {
    return {};
  }
}
function write(s: State) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/**
 * Politely surfaces the optional feedback questionnaire at the end of a
 * session. "End of session" = the user has spent enough time in the app that
 * a meaningful session has occurred. Never blocks navigation and is fully
 * skippable. Won't re-prompt for 14 days after being shown.
 */
export function FeedbackPrompt() {
  const [showToast, setShowToast] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const state = read();
    if (state.status === SUBMITTED) return;
    const cooldown = COOLDOWNS[loadPreferences().feedbackFrequency] ?? COOLDOWNS.normal;
    if (cooldown === Infinity) return;
    if (state.lastAt && Date.now() - state.lastAt < cooldown) return;


    const t = window.setTimeout(() => setShowToast(true), IDLE_MS);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    write({ status: DISMISSED, lastAt: Date.now() });
    setShowToast(false);
  };

  const open = () => {
    setShowToast(false);
    setShowDialog(true);
  };

  const closeDialog = (submitted = false) => {
    write({ status: submitted ? SUBMITTED : DISMISSED, lastAt: Date.now() });
    setShowDialog(false);
  };

  return (
    <>
      {showToast && (
        <div className="fixed bottom-4 right-4 z-[90] max-w-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-elegant">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
              <MessageSquareHeart className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Would you share quick feedback?
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Anonymous · optional · under a minute. It helps us improve CareerPilot AI.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={open}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  Sure
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      {showDialog && <FeedbackDialog onClose={() => closeDialog(true)} />}
    </>
  );
}
