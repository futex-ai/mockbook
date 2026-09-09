import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { loadConfig } from "../dist/config/load.js";
import { readManifest } from "../dist/registry/manifest.js";
import { changedManifestRoutes } from "../dist/server/changed.js";
import { repositoryRoot } from "./helpers/fixture.js";

const configPromise = loadConfig(path.join(repositoryRoot, "examples/basic"));

for (const stylesheet of [
  "design-components.css",
  "design-component-inspection.css",
  "design-component-details.css",
]) {
  test(`${stylesheet} changes only the component design routes`, async () => {
    const config = await configPromise;
    const manifest = readManifest(config);
    const componentRoutes = manifest.entries
      .flatMap((entry) =>
        entry.kind !== "collection" &&
        entry.route.startsWith("design/components/")
          ? [entry.route]
          : [],
      )
      .sort();
    assert.equal(componentRoutes.length, 18);

    assert.deepEqual(
      changedManifestRoutes(manifest, manifest, config, [
        `examples/basic/generated/${stylesheet}`,
      ]),
      componentRoutes,
    );
  });
}
