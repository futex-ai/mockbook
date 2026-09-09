import { expect, test } from "@playwright/test";

for (const width of [390, 1280]) {
  test(`document pages retain metadata, anchors and mixed navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/id/example-handbook?fragment=next-steps");
    await expect(page.locator("#mb-main h2")).toHaveText("Getting started");
    const frame = page.locator(".mbk-stage-embed iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute(
      "src",
      /\/static\/handbook.html#next-steps$/,
    );
    await expect(frame).toHaveAttribute("sandbox", "allow-same-origin");
    await expect(
      page.locator(
        "#mb-main [data-diff-screen], #mb-main [data-viewport-option], #mb-main [data-color-scheme-option]",
      ),
    ).toHaveCount(0);
    await expect(
      page.frameLocator(".mbk-stage-embed iframe").locator("#next-steps"),
    ).toBeVisible();
    await page.locator("[data-mokabook-details] summary").click();
    await expect(page.locator("[data-mokabook-details]")).toContainText(
      "handbook.html",
    );
    await expect(page.locator("[data-mokabook-details]")).toContainText(
      "documents",
    );
    await page.locator("[data-mokabook-details] summary").click();
    if (width < 700)
      await page
        .getByRole("button", { name: "Open catalogue navigation" })
        .click();
    await expect(
      page.locator('[data-nav-collection="collection:example"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('[data-entry-id="example-handbook"]'),
    ).toHaveCount(1);
    const search = page.locator("[data-mokabook-search]");
    for (const query of [
      "example-handbook",
      "Getting started",
      "handbook.html",
      "tag:documents",
    ]) {
      await search.fill(query);
      await expect(
        page.locator('[data-entry-id="example-handbook"]'),
      ).toBeVisible();
    }
    await search.fill("");
    await page
      .locator('[data-nav-collection="collection:example-screens"] > summary')
      .click();
    await page.locator('[data-entry-id="example-welcome"]').click();
    await expect(page.locator("#mb-main h2")).toHaveText("Welcome");
    if (width < 700)
      await page.getByRole("button", { name: "Mobile", exact: true }).click();
    const screenFrame =
      width < 700 ? ".mbk-frame-mobile iframe" : ".mbk-frame-desktop iframe";
    await page
      .frameLocator(screenFrame)
      .getByRole("link", { name: "Read the handbook" })
      .click();
    await expect(page).toHaveURL(/\/view\/handbook.html\?fragment=next-steps$/);
    await page.goBack();
    await expect(page.locator("#mb-main h2")).toHaveText("Welcome");
    await page.goForward();
    await expect(frame).toHaveAttribute("src", /#next-steps$/);
  });
}
