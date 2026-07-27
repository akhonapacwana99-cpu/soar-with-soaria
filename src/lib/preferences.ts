// Local, device-scoped preferences. No account exists, so these live in
// localStorage on this device only.
export type ThemePref = "light" | "dark" | "system";
export type FeedbackFrequency = "normal" | "rare" | "never";

export type Preferences = {
  displayName: string;
  theme: ThemePref;
  feedbackFrequency: FeedbackFrequency;
  notifyReflection: boolean;
  notifyJourney: boolean;
  notifyTips: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  displayName: "",
  theme: "system",
  feedbackFrequency: "normal",
  notifyReflection: true,
  notifyJourney: true,
  notifyTips: false,
};

const KEY = "careerpilot:prefs:v1";

export function loadPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences> | null;
    if (!parsed || typeof parsed !== "object") return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Preferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

export function applyTheme(theme: ThemePref) {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}
