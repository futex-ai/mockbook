import { execFileSync } from "node:child_process";
import fs from "node:fs";

import { compileCatalogue } from "../../dist/build/compile.js";
import { writeCompilation } from "../../dist/build/transaction.js";
import { loadConfig } from "../../dist/config/load.js";
import { serve } from "../../dist/server/serve.js";
import { createFixture, removeFixture } from "../helpers/fixture.js";

/** Real Git-backed comparison server with changed, added, removed, and light-only screens. */
export async function comparisonFixture() {
  const fixture = await createFixture(source(false), {
    extraConfig: 'colorSchemes: ["light", "dark"],',
  });
  const config = await loadConfig(fixture.root);
  await writeCompilation(await compileCatalogue(config), config);
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: fixture.root, stdio: "pipe" });
  git("init", "-q");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  git("add", ".");
  git("commit", "-qm", "test: baseline");
  await fs.promises.writeFile(fixture.entryPath, source(true));
  const running = await serve(config, { base: "HEAD", port: 0, watch: false });
  return {
    ...fixture,
    outDir: config.review.outDir,
    url: running.url,
    async close() {
      await running.close();
      await removeFixture(fixture);
    },
  };
}

function source(changed: boolean): string {
  const third = changed ? "added" : "removed";
  return `import { defineCollection, defineScreen } from "mokabook";
import React from "react";
const metadata = { dependencies: ["notes.md"], relatedDocs: ["notes.md"] };
export const mockups = [
  defineCollection({ ...metadata, childIds: ["home", "details", "${third}"], description: "Fixture collection", id: "fixture", title: "Fixture" }),
  defineScreen({ ...metadata, id: "home", title: "Home", route: "screens/home.html", description: "Home screen", useCaseIds: [],
    mobile: <main><h1>${changed ? "Current" : "Previous"} home</h1><a id="snapshot-link" href="mock:details" target="_top">Details</a></main>,
    desktop: <main><h1>${changed ? "Current" : "Previous"} home</h1><a id="snapshot-link" href="mock:details" target="_top">Details</a></main> }),
  defineScreen({ ...metadata, colorSchemes: ["light"], id: "details", title: "Details", route: "screens/details.html", description: "Details screen", useCaseIds: [], mobile: <main>Details</main>, desktop: <main>Details</main> }),
  defineScreen({ ...metadata, id: "${third}", title: "${third === "added" ? "Added" : "Removed"}", route: "screens/${third}.html", description: "One-sided screen", useCaseIds: [], mobile: <main>${third}</main>, desktop: <main>${third}</main> })
];`;
}
