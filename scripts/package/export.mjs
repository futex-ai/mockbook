import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/** Inspect only the installed CLI's artifact; never import the source exporter. */
export async function inspectConsumerExport(
  root,
  relative,
  base,
  expected = [],
) {
  const output = path.join(root, relative);
  const read = (name) => fs.promises.readFile(path.join(output, name), "utf8");
  const marker = JSON.parse(await read(".mokabook-export-artifact"));
  assert.equal(marker.schemaVersion, 1);
  for (const name of [
    "index.html",
    "404.html",
    "__mokabook/client/browse.js",
    "__mokabook/client/static_delivery.js",
    "__mokabook/navigation/delivery.js",
    "__mokabook/fonts/InterVariable.woff2",
    ...expected,
  ])
    assert.ok(marker.files.includes(name), `export missing ${name}`);
  for (const name of marker.files) {
    assert.ok(!name.split("/").includes(".."));
    assert.equal(
      /(?:^|\/)(?:node_modules|\.git|scripts|entries)\//.test(name),
      false,
    );
    assert.equal(/\.(?:tsx?|map)$/.test(name), false);
    assert.ok((await fs.promises.stat(path.join(output, name))).isFile());
  }
  const home = await read("index.html");
  assert.match(home, /data-mokabook-static=""/);
  assert.doesNotMatch(home, /client\/browser\.js/);
  const comparison = marker.files.find((name) =>
    /^__mokabook\/diffs\/__generations\/[a-f0-9]{64}\/review\.json$/.test(name),
  );
  assert.ok(comparison);
  const review = JSON.parse(await read(comparison));
  assert.equal(review.baseRef, base);
  assert.equal(review.schemaVersion, 2);
  for (const screen of review.screens) {
    for (const view of screen.views) {
      for (const snapshot of [view.beforePath, view.afterPath].filter(Boolean))
        assert.ok(
          marker.files.includes(
            path.posix.join(path.posix.dirname(comparison), snapshot),
          ),
        );
    }
  }
  return review;
}
