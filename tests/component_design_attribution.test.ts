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
  "design-component-inspector.css",
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
    assert.equal(componentRoutes.length, 31);

    assert.deepEqual(
      changedManifestRoutes(manifest, manifest, config, [
        `examples/basic/generated/${stylesheet}`,
      ]),
      componentRoutes,
    );
  });
}

test("control stylesheet changes only its eleven owning routes", async () => {
  const config = await configPromise;
  const manifest = readManifest(config);
  const routes = manifest.entries
    .flatMap((entry) =>
      entry.kind === "screen" &&
      entry.route.startsWith("design/components/controls/")
        ? [entry.route]
        : [],
    )
    .sort();
  assert.equal(routes.length, 11);
  assert.deepEqual(
    changedManifestRoutes(manifest, manifest, config, [
      "examples/basic/generated/design-component-controls.css",
    ]),
    routes,
  );
});
