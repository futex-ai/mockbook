import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { loadConfig } from "../../dist/config/load.js";
import { exportCatalogue } from "../../dist/export/run.js";
import { repositoryRoot } from "../helpers/fixture.js";
import { serveStaticFiles } from "../helpers/static_server.js";

test("the owning example screens remain usable at mobile and desktop sizes", async ({
  page,
}, info) => {
  const output = await fs.promises.mkdtemp(
    path.join(repositoryRoot, ".context/mokabook-example-export-"),
  );
  const config = await loadConfig(
    repositoryRoot,
    "examples/basic/mokabook.config.ts",
  );
  await exportCatalogue(config, { outDir: output });
  const server = await serveStaticFiles(output);
  try {
    const failures: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 400) failures.push(response.url());
    });
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${server.url}/id/example-welcome/?fragment=welcome`);
      await expect(page).toHaveURL(
        `${server.url}/view/screens/welcome.html?fragment=welcome`,
      );
      await page
        .getByRole("button", {
          name: width === 390 ? "Mobile" : "Desktop",
          exact: true,
        })
        .click();
      for (const mode of ["Current", "Side by side", "Overlay", "Difference"]) {
        await page.getByRole("button", { name: mode, exact: true }).click();
        if (mode !== "Current")
          await expect(page.locator("[data-diff-stage] iframe")).toHaveCount(2);
        const frames = page.locator(
          mode === "Current"
            ? "[data-current-screen] iframe"
            : "[data-diff-stage] iframe",
        );
        for (const frame of await frames.all()) {
          await expect(frame.contentFrame().locator("h1")).toHaveText(
            "Welcome to Mokabook",
          );
          await frame
            .contentFrame()
            .locator("body")
            .evaluate(async () => {
              await document.fonts.ready;
            });
        }
        await page.screenshot({
          path: info.outputPath(`${width}-${mode.replaceAll(" ", "-")}.png`),
        });
      }
    }
    expect(failures).toEqual([]);
    expect(
      server.requests.some((url) => url.includes("/__mokabook/events")),
    ).toBe(false);
  } finally {
    await server.close();
    await fs.promises.rm(output, { recursive: true, force: true });
  }
});
