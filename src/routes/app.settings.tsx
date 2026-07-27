import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Download,
  Loader2,
  Monitor,
  Moon,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/device-id";
import {
  DEFAULT_PREFERENCES,
  applyTheme,
  loadPreferences,
  savePreferences,
  type FeedbackFrequency,
  type Preferences,
  type ThemePref,
} from "@/lib/preferences";
import { deleteDeviceData, exportDeviceData } from "@/lib/account.functions";
import { DEVELOPER } from "@/lib/developer";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CareerPilot AI" },
      {
        name: "description",
        content:
          "Personalise your CareerPilot AI experience: appearance, reminders, feedback prompts, and full control over your data.",
      },
      { property: "og:title", content: "Settings — CareerPilot AI" },
      {
        property: "og:description",
        content: "Appearance, reminders, and full control over your CareerPilot AI data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage;
});

const THEMES: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const FREQUENCIES: { value: FeedbackFrequency; label: string; hint: string }[] = [
  { value: "normal", label: "Occasionally", hint: "About once every two weeks" },
  { value: "rare", label: "Rarely", hint: "At most once every three months" },
  { value: "never", label: "Never", hint: "Don't ask me for feedback" },
];

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
      <span>
        <span className="block text-sm text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 flex-none rounded-full transition ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [deviceId, setDeviceId] = useState("");
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);

  useEffect(() => {
    const p = loadPreferences();
    setPrefs(p);
    applyTheme(p.theme);
    setDeviceId(getDeviceId());
  }, []);

  const update = (patch: Partial<Preferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePreferences(next);
    if (patch.theme) applyTheme(patch.theme);
  };

  const doExport = async () => {
    setBusy("export");
    try {
      const data = await exportDeviceData({ data: { deviceId } });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `careerpilot-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } catch (err) {
      console.error("[settings] export failed", err);
      toast.error("We couldn't prepare your export. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async () => {
    if (
      !confirm(
        "Delete everything? This permanently removes your conversations, documents, reflections and Career DNA. It cannot be undone.",
      )
    )
      return;
    setBusy("delete");
    try {
      await deleteDeviceData({ data: { deviceId } });
      toast.success("All of your data has been deleted.");
    } catch (err) {
      console.error("[settings] delete failed", err);
      toast.error("We couldn't delete your data. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="font-display text-3xl font-semibold text-foreground">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        CareerPilot AI works without an account, so these preferences live on this device.
      </p>

      <div className="mt-8 space-y-5">
        <Section
          icon={User}
          title="Your profile"
          description="How Soaria addresses you. Stored on this device only."
        >
          <label className="block text-sm">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Preferred name
            </span>
            <input
              value={prefs.displayName}
              onChange={(e) => update({ displayName: e.target.value.slice(0, 60) })}
              placeholder="e.g. Thandi"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring/30 focus:ring-2"
            />
          </label>
          <p className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            You are using CareerPilot AI as a user. {DEVELOPER.name} is the{" "}
            {DEVELOPER.role.toLowerCase()} of this app — a separate identity from your profile,
            never mixed with your data.
          </p>
        </Section>

        <Section
          icon={Sun}
          title="Appearance"
          description="Choose a theme that's easiest on your eyes."
        >
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => update({ theme: value })}
                aria-pressed={prefs.theme === value}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition ${
                  prefs.theme === value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section
          icon={Bell}
          title="Notifications & prompts"
          description="Gentle in-app nudges. Nothing is emailed and nothing leaves this device."
        >
          <div className="divide-y divide-border">
            <Toggle
              label="Reflection reminders"
              hint="A daily nudge to check in with yourself"
              checked={prefs.notifyReflection}
              onChange={(v) => update({ notifyReflection: v })}
            />
            <Toggle
              label="Journey milestones"
              hint="Celebrate progress on your Ascension Journey"
              checked={prefs.notifyJourney}
              onChange={(v) => update({ notifyJourney: v })}
            />
            <Toggle
              label="Career tips"
              hint="Occasional practical suggestions from Soaria"
              checked={prefs.notifyTips}
              onChange={(v) => update({ notifyTips: v })}
            />
          </div>
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              How often may we ask for feedback?
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => update({ feedbackFrequency: f.value })}
                  aria-pressed={prefs.feedbackFrequency === f.value}
                  className={`rounded-xl border p-3 text-left transition ${
                    prefs.feedbackFrequency === f.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-accent"
                  }`}
                >
                  <span className="block text-sm font-medium text-foreground">{f.label}</span>
                  <span className="block text-xs text-muted-foreground">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section
          icon={Download}
          title="Your data"
          description="Everything is scoped to this device. You stay in control."
        >
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Device ID</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">
              {deviceId || "—"}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={doExport}
              disabled={!deviceId || busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy === "export" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export my data
            </button>
            <button
              onClick={doDelete}
              disabled={!deviceId || busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/40 px-4 py-2.5 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
            >
              {busy === "delete" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete everything
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
