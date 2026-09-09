import { expect, type Page } from "@playwright/test";

/** Click an action that requests a comparison and wait for its response. */
export async function loadComparison(
  page: Page,
  action: "Overlay" | "Side by side" | "Try again" | "Refresh comparison",
): Promise<void> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/__mokabook/diffs/") &&
        new URL(response.url()).pathname.endsWith("/review.json") &&
        response.status() !== 302,
    ),
    page.getByRole("button", { name: action, exact: true }).click(),
  ]);
  expect(response.ok()).toBe(true);
  expect(await response.finished()).toBeNull();
}
