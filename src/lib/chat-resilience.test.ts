import { describe, expect, it, vi } from "vitest";
import {
  LOAD_TIMEOUT_MS,
  TimeoutError,
  mapStreamError,
  normalizeStoredMessages,
  normalizeThreads,
  restoreThread,
  withTimeout,
} from "./chat-resilience";

/**
 * Integration-style tests for the Ask Soaria request lifecycle. Every case
 * asserts the same contract: loading always ends, in success or in a handled
 * error — never an infinite spinner.
 */

describe("gateway errors", () => {
  it("maps out-of-credits (402) to a calm message", () => {
    expect(mapStreamError({ statusCode: 402, message: "Payment Required" })).toContain(
      "out of credits",
    );
  });

  it("maps rate limiting (429)", () => {
    expect(mapStreamError({ statusCode: 429 })).toContain("a lot of requests");
  });

  it("maps auth failures without leaking details", () => {
    const msg = mapStreamError({ status: 401, message: "invalid api key sk-live-xyz" });
    expect(msg).not.toContain("sk-live");
    expect(msg).toContain("try again");
  });

  it("maps upstream 5xx", () => {
    expect(mapStreamError({ statusCode: 503 })).toContain("having trouble");
  });

  it("falls back for unknown/null/undefined errors", () => {
    for (const e of [null, undefined, {}, new Error("boom"), "weird"]) {
      expect(mapStreamError(e)).toBe("Something interrupted Soaria's reply. Please try again.");
    }
  });

  it("maps timeouts and aborts", () => {
    expect(mapStreamError(new TimeoutError())).toContain("too long");
    expect(mapStreamError({ message: "The operation was aborted" })).toContain("too long");
  });
});

describe("stream timeouts", () => {
  it("rejects with TimeoutError when the request never settles", async () => {
    vi.useFakeTimers();
    const hanging = new Promise(() => {});
    const p = withTimeout(hanging, 60_000);
    const assertion = expect(p).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;
    vi.useRealTimers();
  });

  it("resolves normally and clears its timer when the request is fast", async () => {
    vi.useFakeTimers();
    const p = withTimeout(Promise.resolve("ok"), LOAD_TIMEOUT_MS);
    await expect(p).resolves.toBe("ok");
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("propagates a real rejection instead of waiting for the timeout", async () => {
    await expect(withTimeout(Promise.reject(new Error("db down")), 5000)).rejects.toThrow(
      "db down",
    );
  });
});

describe("null / malformed API responses", () => {
  it("returns an empty list for null, undefined and non-array payloads", () => {
    for (const bad of [null, undefined, {}, "", 0, NaN]) {
      expect(normalizeStoredMessages(bad)).toEqual([]);
      expect(normalizeThreads(bad)).toEqual([]);
    }
  });

  it("skips malformed rows but keeps the valid ones", () => {
    const rows = [
      null,
      "nope",
      { id: "1", role: "user", parts: null, content: "hello" },
      { id: "2", role: "assistant", parts: [{ type: "text", text: "hi there" }], content: "" },
      { id: "3", role: "assistant", parts: [], content: "   " },
      { role: "weird-role", content: "no id" },
    ];
    const out = normalizeStoredMessages(rows);
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual({ id: "1", role: "user", parts: [{ type: "text", text: "hello" }] });
    expect(out[1].parts[0].text).toBe("hi there");
    expect(out[2].role).toBe("assistant");
    expect(out[2].id).toMatch(/^restored-/);
  });

  it("falls back to content when parts contain unknown part types", () => {
    const out = normalizeStoredMessages([
      { id: "a", role: "assistant", parts: [{ type: "tool-call" }], content: "fallback text" },
    ]);
    expect(out[0].parts[0].text).toBe("fallback text");
  });

  it("gives threads a safe title and never yields an id-less thread", () => {
    const out = normalizeThreads([
      { id: "t1", title: "  ", updated_at: null },
      { id: "", title: "ghost" },
      { title: "no id" },
      { id: "t2", title: "Real chat", updated_at: "2026-01-01" },
    ]);
    expect(out).toEqual([
      { id: "t1", title: "New conversation", updated_at: "" },
      { id: "t2", title: "Real chat", updated_at: "2026-01-01" },
    ]);
  });
});

describe("thread restoration", () => {
  it("restores threads and messages on the happy path", async () => {
    const result = await restoreThread({
      listThreads: async () => [{ id: "t1", title: "Career pivot", updated_at: "2026-01-02" }],
      getMessages: async () => [
        { id: "m1", role: "user", parts: [{ type: "text", text: "Hi Soaria" }] },
        { id: "m2", role: "assistant", content: "Tell me more." },
      ],
    });
    expect(result.status).toBe("ready");
    expect(result.threads).toHaveLength(1);
    expect(result.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("returns a handled error (never rejects) when the database call fails", async () => {
    const result = await restoreThread({
      listThreads: async () => {
        throw new Error("relation does not exist");
      },
      getMessages: async () => [],
    });
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.message).toBe("We couldn't load this conversation. Please try again.");
      expect(result.message).not.toContain("relation");
    }
    expect(result.messages).toEqual([]);
  });

  it("stops loading with a timeout message when restoration hangs", async () => {
    vi.useFakeTimers();
    const p = restoreThread({
      listThreads: () => new Promise(() => {}),
      getMessages: () => new Promise(() => {}),
      timeoutMs: 15_000,
    });
    await vi.advanceTimersByTimeAsync(15_000);
    const result = await p;
    vi.useRealTimers();
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.message).toContain("in time");
  });

  it("survives a server function that resolves with null", async () => {
    const result = await restoreThread({
      listThreads: async () => null,
      getMessages: async () => null,
    });
    expect(result.status).toBe("ready");
    expect(result.threads).toEqual([]);
    expect(result.messages).toEqual([]);
  });

  it("always settles — a retry after a failure succeeds", async () => {
    let attempt = 0;
    const listThreads = async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("network");
      return [{ id: "t1", title: "Recovered", updated_at: "2026-01-03" }];
    };
    const first = await restoreThread({ listThreads, getMessages: async () => [] });
    expect(first.status).toBe("error");
    const second = await restoreThread({ listThreads, getMessages: async () => [] });
    expect(second.status).toBe("ready");
    expect(second.threads[0].title).toBe("Recovered");
  });
});
