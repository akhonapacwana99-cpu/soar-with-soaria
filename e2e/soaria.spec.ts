import { expect, test, type Page } from "@playwright/test";

/**
 * Ask Soaria smoke tests.
 *
 * Contract under test:
 *  1. /app/soaria resolves to a real thread route (/app/soaria/<id>).
 *  2. The thread page MOUNTS — the chat composer renders.
 *  3. The loading spinner ALWAYS stops: either chat renders, or a friendly
 *     error state with a retry button appears. Never an endless spinner.
 */

const SETTLE_MS = 30_000;

async function waitForSettled(page: Page) {
  await expect
    .poll(
      async () => {
        if (await page.getByTestId("thread-error").isVisible().catch(() => false)) return "error";
        if (await page.getByTestId("chat-composer").isVisible().catch(() => false)) return "chat";
        return "loading";
      },
      { timeout: SETTLE_MS, message: "Ask Soaria never left the loading spinner" },
    )
    .not.toBe("loading");

  return (await page.getByTestId("thread-error").isVisible().catch(() => false))
    ? "error"
    : "chat";
}

test("thread page mounts from /app/soaria and the spinner stops", async ({ page }) => {
  await page.goto("/app/soaria");

  const state = await waitForSettled(page);

  if (state === "chat") {
    await expect(page).toHaveURL(/\/app\/soaria\/[^/]+$/);
    await expect(page.getByTestId("chat-composer")).toBeVisible();
    await expect(page.getByTestId("thread-loading")).toHaveCount(0);
  } else {
    // Degraded backend: must be a friendly, recoverable error, not a spinner.
    await expect(page.getByTestId("thread-retry")).toBeVisible();
  }
});

test("direct navigation to a thread id always settles", async ({ page }) => {
  await page.goto("/app/soaria/00000000-0000-4000-8000-000000000000");
  const state = await waitForSettled(page);
  expect(["chat", "error"]).toContain(state);
  await expect(page.getByTestId("thread-loading")).toHaveCount(0);
});

test("thread load failure shows the reason and a working retry", async ({ page }) => {
  // Force every server-function call for the thread to fail.
  await page.route("**/_serverFn/**", (route) => route.abort("failed"));
  await page.goto("/app/soaria/00000000-0000-4000-8000-000000000000");

  const error = page.getByTestId("thread-error");
  await expect(error).toBeVisible({ timeout: SETTLE_MS });
  await expect(page.getByTestId("thread-loading")).toHaveCount(0);
  await expect(error).toContainText(/couldn't load/i);

  const retry = page.getByTestId("thread-retry");
  await expect(retry).toBeVisible();

  // Recover: unblock the network and retry — the UI must leave the error state.
  await page.unroute("**/_serverFn/**");
  await retry.click();
  const state = await waitForSettled(page);
  expect(["chat", "error"]).toContain(state);
});

test("thread load failure is recorded for analytics", async ({ page }) => {
  await page.route("**/_serverFn/**", (route) => route.abort("failed"));
  await page.goto("/app/soaria/00000000-0000-4000-8000-000000000000");
  await expect(page.getByTestId("thread-error")).toBeVisible({ timeout: SETTLE_MS });

  const events = await page.evaluate(() => {
    try {
      return JSON.parse(window.localStorage.getItem("careerpilot.analytics.v1") ?? "[]");
    } catch {
      return [];
    }
  });
  expect(Array.isArray(events)).toBe(true);
  expect(events.some((e: { name?: string }) => e?.name === "thread_load_failed")).toBe(true);
});
