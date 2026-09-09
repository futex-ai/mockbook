import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { repositoryRoot } from "../helpers/fixture.js";
import { focusDesignLink } from "./design_test_helpers.js";
import { startPreviewFixture, type PreviewFixture } from "./preview_fixture.js";

let preview: PreviewFixture;
test.describe.configure({ timeout: 90_000 });

test.beforeAll(async () => {
  test.setTimeout(90_000);
  const before = await generatedDigest();
  preview = await startPreviewFixture(true);
  expect(await generatedDigest()).toBe(before);
});

test.afterAll(async () => {
  await preview?.close();
});

for (const viewport of ["mobile", "desktop"] as const) {
  test(`${viewport}: published design states and styled buttons use the same navigation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(`${preview.url}/view/design/browse/views/home`);
    await page.locator(`[data-viewport-option="${viewport}"]`).click();
    const frame = page.frameLocator(`.mbk-frame-${viewport} iframe`);
    await frame.locator(".mbk-empty-link").click();
    await expect(page).toHaveURL(/\/view\/design\/browse\/views\/screen$/);
    await frame.locator(".mbk-shot-link").first().click();
    await expect(page).toHaveURL(
      /\/view\/design\/browse\/views\/details-screen$/,
    );
    await expect(
      page.locator('a[data-route="design/browse/views/details-screen.html"]'),
    ).toHaveAttribute("aria-current", "page");
    await frame.locator(".mbk-shot-link").first().click();
    await frame.locator(".mbk-search-tag").click();
    await frame
      .getByRole("group", { name: "Tags", exact: true })
      .getByRole("link", { name: "onboarding", exact: true })
      .click();
    await expect(page).toHaveURL(
      /\/view\/design\/browse\/states\/tags\/onboarding$/,
    );
    await frame.locator(".mbk-search-tag").click();
    await expect(page).toHaveURL(
      /\/view\/design\/browse\/states\/tags\/onboarding-picker$/,
    );
    await frame
      .getByRole("group", { name: "Tags", exact: true })
      .getByRole("link", { name: "onboarding", exact: true })
      .click();
    await expect(page).toHaveURL(/\/view\/design\/browse\/views\/screen$/);
    await page.goto(`${preview.url}/id/design-page-view`);
    await frame.locator(".mbk-details-bar").click();
    await expect(page).toHaveURL(/\/view\/design\/browse\/pages\/details$/);
    await frame.locator(".mbk-details-bar").click();
    await frame
      .getByRole("link", { name: "Open Welcome", exact: true })
      .click();
    await expect(page).toHaveURL(/\/view\/design\/browse\/views\/screen$/);
    await page.goto(`${preview.url}/view/screens/welcome`);
    await page.locator('.mbk-topbar [data-color-scheme-option="dark"]').click();
    await frame
      .getByRole("link", { name: "View details", exact: true })
      .click();
    await expect(page).toHaveURL(/\/view\/screens\/details\?fragment=details$/);
    await expect(page.locator(`.mbk-frame-${viewport} iframe`)).toHaveAttribute(
      "src",
      /\.dark(?:\.html)?#details$/,
    );
    const back = frame.locator('a[data-mokabook-link-control="button"]');
    await focusDesignLink(back);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/view\/screens\/welcome$/);
  });

  test(`${viewport}: actual Review links stay inside the isolated current snapshot`, async ({
    page,
  }) => {
    await page.goto(`${preview.url}/view/screens/welcome`);
    await page.locator(`[data-viewport-option="${viewport}"]`).click();
    await page
      .getByRole("button", { name: "Side by side", exact: true })
      .click();
    const iframe = page.locator("[data-diff-stage] iframe").last();
    await expect(iframe).toHaveAttribute("sandbox", "");
    const frame = iframe.contentFrame();
    const next = frame.getByRole("link", { name: "View details", exact: true });
    await expect(next).toHaveAttribute(
      "href",
      `./details.${viewport}.html#details`,
    );
    await next.click();
    await expect(page).toHaveURL(`${preview.url}/view/screens/welcome`);
    await expect(frame.locator("main#details")).toBeVisible();
    await frame.locator('a[data-mokabook-link-control="button"]').click();
    await expect(frame.locator("main#welcome")).toBeVisible();
    await expect(page.locator("#mb-main h2")).toHaveText("Welcome");
  });
}

async function generatedDigest(): Promise<string> {
  const root = path.join(repositoryRoot, "examples/basic/generated");
  const hash = crypto.createHash("sha256");
  for (const relative of (await fs.readdir(root, { recursive: true })).sort()) {
    const file = path.join(root, relative);
    if ((await fs.stat(file)).isFile()) {
      hash.update(relative);
      hash.update(await fs.readFile(file));
    }
  }
  return hash.digest("hex");
}
