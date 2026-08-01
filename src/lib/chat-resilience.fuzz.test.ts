import { describe, expect, it } from "vitest";
import {
  mapStreamError,
  normalizeStoredMessages,
  normalizeThreads,
  restoreThread,
} from "./chat-resilience";

/**
 * Property-based / fuzz coverage: the chat + thread normalizers and the
 * restoration path must survive ANY payload shape without throwing.
 */

// Deterministic PRNG so a failure is always reproducible.
function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const PRIMITIVES: unknown[] = [
  null,
  undefined,
  0,
  -1,
  NaN,
  Infinity,
  "",
  "text",
  "   ",
  true,
  false,
  Symbol("s"),
  123n,
  () => {},
  new Date(0),
  new Error("boom"),
  {},
  [],
  { type: "text" },
  { type: "text", text: null },
  { type: "tool-call", text: 42 },
  { toString: null },
  Object.create(null),
];

function randomValue(rand: () => number, depth = 0): unknown {
  const roll = rand();
  if (depth > 3 || roll < 0.5) {
    return PRIMITIVES[Math.floor(rand() * PRIMITIVES.length)];
  }
  if (roll < 0.75) {
    const len = Math.floor(rand() * 4);
    return Array.from({ length: len }, () => randomValue(rand, depth + 1));
  }
  const keys = ["id", "role", "content", "parts", "title", "updated_at", "created_at", "x"];
  const obj: Record<string, unknown> = {};
  const count = Math.floor(rand() * keys.length);
  for (let i = 0; i < count; i++) {
    obj[keys[Math.floor(rand() * keys.length)]] = randomValue(rand, depth + 1);
  }
  return obj;
}

const ITERATIONS = 500;

describe("fuzz: normalizeStoredMessages", () => {
  it("never throws and always returns well-formed messages", () => {
    const rand = makeRandom(20260801);
    for (let i = 0; i < ITERATIONS; i++) {
      const payload = randomValue(rand);
      let out: ReturnType<typeof normalizeStoredMessages>;
      try {
        out = normalizeStoredMessages(payload);
      } catch (err) {
        throw new Error(
          `normalizeStoredMessages threw on iteration ${i}: ${String(err)} — payload ${safe(payload)}`,
        );
      }
      expect(Array.isArray(out)).toBe(true);
      for (const m of out) {
        expect(typeof m.id).toBe("string");
        expect(m.id.length).toBeGreaterThan(0);
        expect(["user", "assistant", "system"]).toContain(m.role);
        expect(Array.isArray(m.parts)).toBe(true);
        expect(m.parts).toHaveLength(1);
        expect(m.parts[0].type).toBe("text");
        expect(typeof m.parts[0].text).toBe("string");
        expect(m.parts[0].text.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("fuzz: normalizeThreads", () => {
  it("never throws and always returns usable thread rows", () => {
    const rand = makeRandom(4242);
    for (let i = 0; i < ITERATIONS; i++) {
      const payload = randomValue(rand);
      let out: ReturnType<typeof normalizeThreads>;
      try {
        out = normalizeThreads(payload);
      } catch (err) {
        throw new Error(
          `normalizeThreads threw on iteration ${i}: ${String(err)} — payload ${safe(payload)}`,
        );
      }
      expect(Array.isArray(out)).toBe(true);
      for (const t of out) {
        expect(typeof t.id).toBe("string");
        expect(t.id.length).toBeGreaterThan(0);
        expect(typeof t.title).toBe("string");
        expect(t.title.trim().length).toBeGreaterThan(0);
        expect(typeof t.updated_at).toBe("string");
      }
    }
  });
});

describe("fuzz: mapStreamError", () => {
  it("always returns a non-empty, leak-free string for any thrown value", () => {
    const rand = makeRandom(777);
    const extras: unknown[] = [
      { statusCode: 402 },
      { status: 429 },
      { statusCode: 500, message: "sk-live-secret" },
      { statusCode: "not-a-number" },
      { get statusCode(): number { throw new Error("getter blew up"); } },
    ];
    for (let i = 0; i < ITERATIONS; i++) {
      const payload = i < extras.length ? extras[i] : randomValue(rand);
      let msg: string;
      try {
        msg = mapStreamError(payload);
      } catch {
        // A hostile getter is the only case allowed to throw upstream; the
        // helper must still not leak. Treat any throw as a failure.
        throw new Error(`mapStreamError threw on iteration ${i} — payload ${safe(payload)}`);
      }
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
      expect(msg).not.toMatch(/sk-live|api[_-]?key|Bearer /i);
    }
  });
});

describe("fuzz: restoreThread", () => {
  it("always resolves to a handled result for any server payload or failure", async () => {
    const rand = makeRandom(31337);
    for (let i = 0; i < 200; i++) {
      const threadsPayload = randomValue(rand);
      const messagesPayload = randomValue(rand);
      const failThreads = rand() < 0.2;
      const failMessages = rand() < 0.2;
      const result = await restoreThread({
        listThreads: async () => {
          if (failThreads) throw randomValue(rand);
          return threadsPayload;
        },
        getMessages: async () => {
          if (failMessages) throw randomValue(rand);
          return messagesPayload;
        },
      });
      expect(["ready", "error"]).toContain(result.status);
      expect(Array.isArray(result.threads)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
      if (result.status === "error") {
        expect(result.message.length).toBeGreaterThan(0);
      }
    }
  });
});

function safe(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}
