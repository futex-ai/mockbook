import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { expect, test } from "@playwright/test";

import { repositoryRoot } from "../helpers/fixture.js";
import { comparisonFixture } from "./diffs_fixture.js";

let fixture: Awaited<ReturnType<typeof comparisonFixture>>;
test.beforeAll(async () => {
  fixture = await comparisonFixture();
});
test.afterAll(async () => {
  await fixture.close();
});

const endpoint = "**/__mokabook/diffs/review.json*";

test("Changes and screen browsing stay lazy until a diff is selected", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/__mokabook/diffs/"))
      requests.push(request.url());
  });
  await page.goto(`${fixture.url}/view/screens/home.html`);
  await expect(
    page.getByRole("navigation", { name: "Mokabook modes" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Review", exact: true }),
  ).toHaveCount(0);
  await page.locator('[data-filter="changed"]').click();
  await expect(page.locator('[data-filter="changed"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).first().click();
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Overlay", exact: true }).click();
  await expect(page.locator("[data-diff-stage] .mb-panes")).toHaveAttribute(
    "data-compare-mode",
    "overlay",
  );
  await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(2);
  await expect(
    page.locator("[data-diff-stage] iframe").first(),
  ).toHaveAttribute("title", "Before — mobile — dark");
  await expect(page.locator('[data-filter="changed"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(requests.length).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await expect(page.locator("[data-current-screen]")).toBeVisible();
  await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(0);
});

test("any screen supports modes, viewport selection, and light-only fallback", async ({
  page,
}) => {
  await page.goto(`${fixture.url}/view/screens/details.html`);
  await page.getByRole("button", { name: "Overlay", exact: true }).click();
  await expect(page.locator("[data-diff-stage]")).toContainText(
    "No changes to this screen",
  );
  await page.getByRole("button", { name: "Dark", exact: true }).first().click();
  await expect(page.locator("[data-diff-stage]")).toContainText("Light only");
  await page.getByRole("button", { name: "Desktop", exact: true }).click();
  await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(2);
  await page.getByRole("button", { name: "Difference", exact: true }).click();
  await expect(page.locator("[data-diff-stage] .mb-panes")).toHaveAttribute(
    "data-compare-mode",
    "difference",
  );
  await page.getByRole("button", { name: "Side by side", exact: true }).click();
  await expect(page.locator("[data-diff-stage] .mb-panes")).toHaveAttribute(
    "data-compare-mode",
    "side",
  );
  await page.getByRole("button", { name: "Both", exact: true }).click();
  await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(4);
  await page.locator('[data-route="screens/home.html"]').click();
  await expect(
    page.getByRole("button", { name: "Current", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(0);
});

test("added and removed screens retain legible missing panes in every mode", async ({
  page,
}) => {
  for (const name of ["added", "removed"]) {
    await page.goto(`${fixture.url}/view/screens/${name}.html`);
    await page.locator('[data-filter="changed"]').click();
    await expect(
      page.locator(`[data-route="screens/${name}.html"]`),
    ).toBeVisible();
    if (name === "removed")
      await expect(page.locator("[data-current-screen]")).toContainText(
        "This screen was removed",
      );
    for (const mode of ["Overlay", "Difference", "Side by side"]) {
      await page.getByRole("button", { name: mode, exact: true }).click();
      await expect(page.locator(".mb-pane-missing").first()).toContainText(
        `This screen was ${name}`,
      );
      await expect(page.locator(".mb-pane-missing").first()).toBeVisible();
    }
  }
});

test("pending requests cannot replace Current or a newly navigated screen", async ({
  page,
}) => {
  let release = (): void => undefined;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(endpoint, async (route) => {
    const response = await route.fetch();
    await waiting;
    await route.fulfill({ response }).catch(() => undefined);
  });
  await page.goto(`${fixture.url}/view/screens/home.html`);
  await page.getByRole("button", { name: "Overlay", exact: true }).click();
  await expect(page.locator("[data-diff-stage]")).toContainText(
    "Loading comparison",
  );
  await page.getByRole("button", { name: "Current", exact: true }).click();
  await expect(page.locator("[data-current-screen]")).toBeVisible();
  await page.locator('[data-route="screens/details.html"]').click();
  release();
  await expect(page.locator("h2")).toHaveText("Details");
  await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Current", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("a failed comparison stays in the screen and retries explicitly", async ({
  page,
}) => {
  await page.route(
    endpoint,
    (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: '{"error":"failed"}',
      }),
    { times: 1 },
  );
  await page.goto(`${fixture.url}/view/screens/home.html`);
  await page.getByRole("button", { name: "Overlay", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  await expect(page.locator("h2")).toHaveText("Home");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(4);
  const oldSource = await page
    .locator("[data-diff-stage] iframe")
    .first()
    .getAttribute("src");
  await page
    .getByRole("button", { name: "Refresh comparison", exact: true })
    .click();
  await expect(
    page.locator("[data-diff-stage] iframe").first(),
  ).not.toHaveAttribute("src", oldSource ?? "");
});

test("snapshot panes keep marked links inside their sandbox", async ({
  page,
}) => {
  await page.goto(`${fixture.url}/view/screens/home.html`);
  await page.getByRole("button", { name: "Side by side", exact: true }).click();
  const iframe = page.locator("[data-diff-stage] iframe").first();
  await expect(iframe).toHaveAttribute("sandbox", "");
  const beforeUrl = page.url();
  await iframe.contentFrame().locator("#snapshot-link").click();
  await expect(page).toHaveURL(beforeUrl);
  await expect(page.locator("h2")).toHaveText("Home");
});

test("narrow diffs fit the shell and retain the catalogue drawer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${fixture.url}/view/screens/home.html`);
  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  await page.getByRole("button", { name: "Overlay", exact: true }).click();
  await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(2);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open catalogue navigation" }).click();
  await expect(
    page.locator('[data-route="screens/details.html"]'),
  ).toBeVisible();
  await page.locator('[data-route="screens/details.html"]').click();
  await expect(page.locator("h2")).toHaveText("Details");
});

test("approved changes mockups render directly from disk", async ({ page }) => {
  for (const mode of ["current", "overlay"]) {
    for (const viewport of ["desktop", "mobile"]) {
      const file = path.join(
        repositoryRoot,
        `examples/basic/generated/design/review/controls/${mode}.${viewport}.html`,
      );
      expect(fs.existsSync(file)).toBe(true);
      await page.goto(pathToFileURL(file).href);
      await expect(
        page.getByRole("group", { name: "Comparison mode" }),
      ).toContainText("Current");
      await expect(
        page.getByRole("navigation", { name: "Mokabook modes" }),
      ).toHaveCount(0);
    }
  }
});

test("mode switches keep frames and cannot expand one side alone", async ({
  page,
}) => {
  await page.goto(`${fixture.url}/view/screens/home.html`);
  await page.getByRole("button", { name: "Desktop", exact: true }).click();
  await page.getByRole("button", { name: "Overlay", exact: true }).click();
  const frame = await page
    .locator("[data-diff-stage] iframe")
    .first()
    .elementHandle();
  expect(frame).not.toBeNull();
  await expect(page.locator("[data-diff-stage] .browser-expand")).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Difference", exact: true }).click();
  expect(await frame?.evaluate((node) => node.isConnected)).toBe(true);
  await frame?.dispose();
});
