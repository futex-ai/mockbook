import { expect, test } from "@playwright/test";

test("native skip-link history preserves the view without refetching it", async ({
  page,
}) => {
  await page.goto("/");
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      request.resourceType() === "fetch" &&
      new URL(request.url()).pathname === "/"
    )
      requests.push(request.url());
  });
  const heading = page.locator("#mb-main h2");
  await heading.evaluate((element) =>
    element.setAttribute("data-retained", "true"),
  );
  await page.keyboard.press("Tab");
  await expect(page.locator(".mbk-skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#mb-main$/);
  await expect(page.locator("#mb-main")).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/#mb-main$/);
  await expect(heading).toHaveAttribute("data-retained", "true");
  expect(requests).toEqual([]);
});

test("saved-variant query history stays separate from native fragment history", async ({
  page,
}) => {
  const path = "/view/design/library/inspector/inspector.html";
  await page.goto(path);
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      request.resourceType() === "fetch" &&
      new URL(request.url()).pathname === path
    )
      requests.push(new URL(request.url()).search);
  });
  const variant = page.getByLabel("Saved variant", { exact: true });
  await variant.selectOption("props");
  await page.locator(".mbk-skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\?variant=props#mb-main$/);
  await page.goBack();
  await expect(page).toHaveURL(/\?variant=props$/);
  await expect(variant).toHaveValue("props");
  await page.goBack();
  await expect(variant).toHaveValue("details");
  await page.goForward();
  await expect(variant).toHaveValue("props");
  await page.goForward();
  await expect(page).toHaveURL(/\?variant=props#mb-main$/);
  await expect(variant).toHaveValue("props");
  expect(requests).toEqual(["", "?variant=props"]);
});

test("same-document Back cancels a pending screen navigation", async ({
  page,
}) => {
  await page.goto("/view/screens/welcome.html");
  await page.locator(".mbk-skip-link").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/welcome\.html#mb-main$/);
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/view/screens/details.html", async (route) => {
    await gate;
    await route.continue();
  });
  const pending = page.waitForRequest((request) =>
    request.url().endsWith("/view/screens/details.html"),
  );
  await page
    .locator('a[data-nav-row][data-route="screens/details.html"]')
    .click();
  await pending;
  const aborted = page.waitForEvent("requestfailed", (request) =>
    request.url().endsWith("/view/screens/details.html"),
  );
  try {
    await page.goBack();
  } finally {
    release();
  }
  await aborted;
  await expect(page).toHaveURL(/welcome\.html$/);
  await expect(page.locator("#mb-main h2")).toHaveText("Welcome");
});
