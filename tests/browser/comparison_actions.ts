import { expect, type Page } from "@playwright/test";

/** Await real snapshot generation before asserting the resulting interface. */
export async function generateComparison(
  page: Page,
  control: "Overlay" | "Side by side" | "Try again" | "Refresh comparison",
): Promise<void> {
  const [response] = await Promise.all([
    page.waitForResponse((response) =>
      /^\/__mokabook\/diffs\/__generations\/[^/]+\/review\.json$/.test(
        new URL(response.url()).pathname,
      ),
    ),
    page.getByRole("button", { name: control, exact: true }).click(),
  ]);
  expect(await response.finished()).toBeNull();
  expect(response.ok()).toBe(true);
}
