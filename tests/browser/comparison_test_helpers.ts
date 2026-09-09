import { expect, type Page } from "@playwright/test";

/** Await on-demand snapshot generation before applying UI assertion deadlines. */
export async function requestComparison(
  page: Page,
  action: "Overlay" | "Side by side" | "Try again" | "Refresh comparison",
): Promise<void> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (result) => {
        const pathname = new URL(result.url()).pathname;
        return (
          pathname.startsWith("/__mokabook/diffs/") &&
          pathname.endsWith("/review.json") &&
          (result.status() < 300 || result.status() >= 400)
        );
      },
      { timeout: 30_000 },
    ),
    page.getByRole("button", { name: action, exact: true }).click(),
  ]);
  expect(response.ok()).toBe(true);
}
