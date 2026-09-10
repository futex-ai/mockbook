import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { expect, test } from "@playwright/test";

import { exportCatalogue } from "../../dist/export/run.js";
import { designLibraryFixture } from "../helpers/design_library_fixture.js";
import { serveStaticFiles } from "../helpers/static_server.js";
import { chooseViewport } from "./workspace_actions.js";

let site: Awaited<ReturnType<typeof serveStaticFiles>>;
const cleanup: (() => Promise<void>)[] = [];
test.beforeAll(async () => {
  const fixture = await designLibraryFixture({
    after: (fn) => cleanup.push(fn),
  });
  await fixture.write(fixture.before);
  const git = (...args: string[]) =>
    promisify(execFile)("git", args, { cwd: fixture.root });
  await git("init", "-q");
  await git("config", "user.email", "test@example.invalid");
  await git("config", "user.name", "Test");
  await git("add", ".");
  await git("commit", "-qm", "test: registered design baseline");
  await git("update-ref", "refs/remotes/origin/main", "HEAD");
  await fixture.edit(
    "examples/basic/entries/design/library/controls/tag-chip.view.tsx",
    (source) => source.replace("{label}", "{label} revised"),
  );
  const output = path.join(fixture.root, "site");
  await exportCatalogue(fixture.config, { outDir: output });
  site = await serveStaticFiles(output);
});
test.afterAll(async () => {
  await site?.close();
  for (const dispose of cleanup.reverse()) await dispose();
});

for (const viewport of ["desktop", "mobile"] as const)
  test(`${viewport}: exported design components retain saved variants, affected consumers and read-only props`, async ({
    page,
  }) => {
    await page.setViewportSize(
      viewport === "mobile"
        ? { width: 390, height: 844 }
        : { width: 1280, height: 900 },
    );
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) failures.push(response.url());
    });
    await page.goto(
      `${site.url}/view/design/library/chrome/top-bar.html?variant=search`,
    );
    await chooseViewport(page, viewport);
    await page.getByRole("tab", { name: "Props", exact: true }).click();
    await expect(page.getByLabel("Query", { exact: true })).toBeDisabled();
    const frame = page.frameLocator(`[data-workspace-frame="${viewport}"]`);
    await expect(frame.locator(".mbk-search-value")).toHaveText("tag:forms");
    await page
      .getByLabel("Saved variant", { exact: true })
      .selectOption("tag-picker");
    await expect(frame.locator(".mbk-tag-picker")).toBeVisible();
    await expect(frame.locator(".mbk-chip").first()).toContainText("revised");
    await page.goto(`${site.url}/view/design/library/controls/tag-chip.html`);
    await expect(
      page.locator(
        '[data-nav-row][data-route="design/library/controls/tag-chip.html"]',
      ),
    ).toHaveAttribute("data-changed", "true");
    await expect(
      page.locator(
        '[data-nav-row][data-route="design/browse/states/tags/picker.html"]',
      ),
    ).not.toHaveAttribute("data-changed", "true");
    await page.getByRole("tab", { name: "Usage", exact: true }).click();
    await expect(
      page.getByRole("tabpanel", { name: "Usage", exact: true }),
    ).toContainText("Tag picker");
    expect(failures).toEqual([]);
  });
