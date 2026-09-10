import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import { compareReview } from "../dist/review/compare.js";
import { startCatalogueServer } from "../dist/server/http.js";
import { componentReviewFixture } from "./helpers/component_review_fixture.js";

test("ordinary Browse serves cached component evidence without generating or writing comparisons", async (t) => {
  const fixture = await componentReviewFixture(t, (source) =>
    source.replace(
      "<button data-viewport=",
      '<button className="changed" data-viewport=',
    ),
  );
  const { result } = await compareReview(
    fixture.after,
    fixture.config,
    fixture.git,
    "main",
  );
  assert.equal(result.schemaVersion, 3);
  if (result.schemaVersion !== 3) return;
  let reads = 0;
  let comparisons = 0;
  const server = await startCatalogueServer(fixture.config, {
    base: "main",
    port: 0,
    componentChangeSource: {
      baseline: async () => "base",
      read: async () => {
        reads++;
        return { baseline: fixture.before.manifest, result };
      },
    },
    review: {
      base: "main",
      outDir: path.join(fixture.root, ".review"),
      generate: async () => {
        comparisons++;
        throw new Error("Ordinary Browse must not generate comparisons");
      },
    },
  });
  t.after(() => server.close());
  for (const route of [
    "/",
    "/view/screens/home.html",
    "/static/screens/home.mobile.html",
    "/view/screens/home.html",
  ])
    assert.equal((await fetch(server.url + route)).status, 200);
  assert.equal(reads, 1);
  assert.equal(comparisons, 0);
  server.publishUpdate({
    version: 2,
    changedRoutes: ["components/action.html"],
  });
  assert.equal(
    (await fetch(server.url + "/view/screens/home.html")).status,
    200,
  );
  assert.equal(reads, 2);
  assert.equal(comparisons, 0);
  await assert.rejects(fs.stat(path.join(fixture.root, ".review")), {
    code: "ENOENT",
  });
  for (const [route, html] of fixture.after.outputs)
    assert.equal(
      await fs.readFile(path.join(fixture.mockupsDir, route), "utf8"),
      html,
    );
});
