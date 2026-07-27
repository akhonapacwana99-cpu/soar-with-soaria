import { describe, expect, it, beforeEach } from "vitest";
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from "./preferences";

const store: Record<string, string> = {};
// Minimal localStorage stub for the node test environment.
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
  removeItem: (k: string) => {
    delete store[k];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  key: () => null,
  length: 0,
} as unknown as Storage;
(globalThis as unknown as { window: unknown }).window = globalThis;

describe("preferences", () => {
  beforeEach(() => localStorage.clear());

  it("returns defaults when nothing is stored", () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("returns defaults for corrupted storage instead of throwing", () => {
    localStorage.setItem("careerpilot:prefs:v1", "{not json");
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("merges partial stored prefs over defaults", () => {
    localStorage.setItem("careerpilot:prefs:v1", JSON.stringify({ theme: "dark" }));
    const p = loadPreferences();
    expect(p.theme).toBe("dark");
    expect(p.feedbackFrequency).toBe(DEFAULT_PREFERENCES.feedbackFrequency);
  });

  it("round-trips a save", () => {
    savePreferences({ ...DEFAULT_PREFERENCES, displayName: "Thandi", notifyTips: true });
    const p = loadPreferences();
    expect(p.displayName).toBe("Thandi");
    expect(p.notifyTips).toBe(true);
  });
});
