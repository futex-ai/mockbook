import { expect, test } from "@playwright/test";

import { createPreviewComparisonFixture } from "../helpers/preview_comparison_fixture.js";
import {
  servePreviewFixture,
  startPreviewFixture,
  type PreviewFixture,
} from "./preview_fixture.js";

let preview: PreviewFixture;

test.describe.configure({ timeout: 90_000 });
test.beforeAll(async () => {
  preview = await startPreviewFixture(true);
});
test.afterAll(async () => {
  await preview.close();
});

test("published Mokabook exposes lazy comparisons in the actual shell", async ({
  page,
}) => {
  const requests: string[] = [];
  const failed: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  await page.goto(`${preview.url}/view/design/review/outcomes/added`);
  const modes = page.getByRole("group", { name: "Comparison mode" });
  await expect(modes).toBeVisible();
  await expect(
    modes.getByRole("button", { name: "Current", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-filter="changed"]').click();
  await page.getByRole("button", { name: "Desktop", exact: true }).click();
  expect(requests.filter((url) => url.includes("/__mokabook/diffs/"))).toEqual(
    [],
  );

  await modes.getByRole("button", { name: "Overlay", exact: true }).click();
  const frames = page.locator("[data-diff-stage] iframe");
  await expect(frames).toHaveCount(2);
  await expect(page.locator(".mb-panes")).toHaveAttribute(
    "data-compare-mode",
    "overlay",
  );
  await expect(
    page.frameLocator("[data-diff-stage] iframe").first().locator("body"),
  ).not.toBeEmpty();
  for (const frame of await frames.all()) {
    await expect(frame).toHaveAttribute("sandbox", "");
    await expect(frame).toHaveAttribute("src", /\/diffs\/__generations\//);
  }
  for (const [label, mode] of [
    ["Side by side", "side"],
    ["Difference", "difference"],
  ] as const) {
    await modes.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(".mb-panes")).toHaveAttribute(
      "data-compare-mode",
      mode,
    );
  }
  await page.getByRole("button", { name: "Refresh comparison" }).click();
  await expect(frames).toHaveCount(2);
  await modes.getByRole("button", { name: "Current", exact: true }).click();
  await expect(frames).toHaveCount(0);
  await expect(page.locator("[data-current-screen]")).toBeVisible();
  expect(requests.some((url) => url.includes("/__mokabook/events"))).toBe(
    false,
  );
  expect(failed).toEqual([]);
});

test("published comparisons retain mobile, dark, and removed-screen navigation", async ({
  page,
}) => {
  const fixture = await createPreviewComparisonFixture();
  const server = await servePreviewFixture(fixture.output);
  try {
    const failures: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 400) failures.push(response.url());
    });
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto(`${server.url}/id/removed`);
    await expect(page.locator("[data-current-screen]")).toContainText(
      "This screen was removed",
    );
    await page.getByRole("button", { name: "Mobile", exact: true }).click();
    await page
      .getByRole("button", { name: "Side by side", exact: true })
      .click();
    await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(1);
    await expect(
      page.frameLocator("[data-diff-stage] iframe").locator("main"),
    ).toHaveText("removed");
    await page
      .getByRole("button", { name: "Open catalogue navigation" })
      .click();
    await page.locator('[data-filter="changed"]').click();
    await expect(
      page.locator('[data-route="screens/removed.html"]'),
    ).toBeVisible();
    await page.locator('[data-route="screens/added.html"]').click();
    await expect(
      page.getByRole("button", { name: "Current", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Overlay", exact: true }).click();
    await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(1);
    await expect(page.locator(".mb-pane-missing")).toHaveText(
      "This screen was added on this branch.",
    );
    await page.goto(`${server.url}/view/screens/home`);
    await page.getByRole("button", { name: "Mobile", exact: true }).click();
    await page.getByRole("button", { name: "Dark", exact: true }).click();
    await page.getByRole("button", { name: "Difference", exact: true }).click();
    const frames = page.locator("[data-diff-stage] iframe");
    await expect(frames).toHaveCount(2);
    await expect(
      page.frameLocator("[data-diff-stage] iframe").first().locator("h1"),
    ).toHaveText("Previous home");
    await expect(
      page.frameLocator("[data-diff-stage] iframe").last().locator("h1"),
    ).toHaveText("Current home");
    for (const frame of await frames.all())
      await expect(frame).toHaveAttribute("src", /\.mobile\.dark\.html$/);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    expect(failures).toEqual([]);
  } finally {
    await server.close();
    await fixture.close();
  }
});
