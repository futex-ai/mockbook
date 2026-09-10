import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { expect, test } from "@playwright/test";

import type { ManifestV4 } from "../../dist/registry/types.js";
import { repositoryRoot } from "../helpers/fixture.js";

const generated = path.join(repositoryRoot, "examples/basic/generated");
const manifest = JSON.parse(
  await fs.readFile(path.join(generated, "mokabook-manifest.json"), "utf8"),
) as ManifestV4;
const fileUrl = (route: string) =>
  pathToFileURL(path.join(generated, route)).href;

for (const viewport of ["desktop", "mobile"] as const) {
  test.describe(`${viewport} shared design library`, () => {
    test.use({
      javaScriptEnabled: false,
      viewport:
        viewport === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
    });

    test("every saved sample loads directly from disk with confined styles and links", async ({
      page,
    }, testInfo) => {
      const failed: string[] = [];
      page.on("requestfailed", (request) => failed.push(request.url()));
      for (const entry of manifest.entries) {
        if (entry.kind !== "component" || !entry.id.startsWith("design-ui-"))
          continue;
        for (const variant of entry.variants) {
          await page.goto(fileUrl(variant.fragments[viewport]));
          await expect(page.locator(".mbk-library-host")).toBeVisible();
          for (const panel of await page
            .locator(".ce-workspace details[open] > .ce-inspector-panel")
            .all()) {
            await expect(panel).toHaveCSS("overflow-y", "auto");
          }
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `${entry.id}/${variant.id} fits`,
          ).toBe(true);
          const urls = await page
            .locator("a[href],link[rel=stylesheet]")
            .evaluateAll((nodes) =>
              nodes.map((node) => (node as HTMLAnchorElement).href),
            );
          for (const url of new Set(urls)) {
            expect(url).toMatch(/^file:/);
            await fs.access(new URL(url));
          }
          await page.screenshot({
            path: testInfo.outputPath(`${entry.id}-${variant.id}.png`),
            fullPage: true,
          });
        }
      }
      expect(failed).toEqual([]);
    });

    test("the last flow step has no trailing connector after registered boundaries", async ({
      page,
    }) => {
      await page.goto(fileUrl(`design/browse/views/use-case.${viewport}.html`));
      const steps = page.locator(".flow-step");
      await expect(steps).toHaveCount(2);
      expect(
        await steps
          .first()
          .evaluate((node) => getComputedStyle(node, "::before").display),
      ).not.toBe("none");
      expect(
        await steps
          .last()
          .evaluate((node) => getComputedStyle(node, "::before").display),
      ).toBe("none");
    });

    test("standalone inline components retain their intrinsic width", async ({
      page,
    }) => {
      for (const [slug, selector] of [
        ["tag-chip", ".mbk-chip"],
        ["change-status", ".ce-change-status"],
      ]) {
        const entry = manifest.entries.find(
          (entry) => entry.id === `design-ui-${slug}`,
        );
        if (entry?.kind !== "component") throw new Error(`Missing ${slug}`);
        await page.goto(fileUrl(entry.variants[0]!.fragments[viewport]));
        expect(
          (await page.locator(selector!).boundingBox())!.width,
        ).toBeLessThan(150);
      }
    });

    test("the legacy footer sample keeps its open content visible", async ({
      page,
    }) => {
      const entry = manifest.entries.find(
        (entry) => entry.id === "design-ui-inspector",
      );
      if (entry?.kind !== "component") throw new Error("Missing footer panel");
      await page.goto(
        fileUrl(
          entry.variants.find((variant) => variant.id === "legacy-details")!
            .fragments[viewport],
        ),
      );
      await expect(
        page.getByText(
          "A shared action with an optional destination and hint.",
        ),
      ).toBeInViewport();
    });
  });
}
