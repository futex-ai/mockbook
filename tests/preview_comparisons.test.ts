import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { compileCatalogue } from "../dist/build/compile.js";
import { writeCompilation } from "../dist/build/transaction.js";
import type { ReviewResult } from "../dist/review/types.js";
import { createPreviewComparisonFixture } from "./helpers/preview_comparison_fixture.js";

test("published comparisons retain real baseline bytes, removed routes, and isolated output", async (context) => {
  const fixture = await createPreviewComparisonFixture();
  context.after(() => fixture.close());
  const read = (relative: string) =>
    fs.promises.readFile(path.join(fixture.output, relative), "utf8");
  const redirects = await read("_redirects");
  const jsonPath = redirects.match(
    /^\/__mokabook\/diffs\/review.json \/(\S+) 302$/m,
  )?.[1];
  assert.ok(jsonPath);
  const result: ReviewResult = JSON.parse(await read(jsonPath));
  assert.deepEqual(
    result.screens.map((screen) => [screen.id, screen.state]),
    [
      ["added", "added"],
      ["details", "unchanged"],
      ["home", "changed"],
      ["removed", "removed"],
    ],
  );
  const generation = path.dirname(jsonPath);
  for (const screen of result.screens) {
    const page = await read(`view/${screen.route}`);
    assert.ok(page.includes(`data-diff-screen="${screen.route}"`));
    for (const view of screen.views) {
      for (const snapshot of [view.beforePath, view.afterPath]) {
        if (!snapshot) continue;
        assert.match(await read(`${generation}/${snapshot}`), /<main/);
      }
    }
  }
  assert.match(
    await read(`${generation}/snapshots/before/screens/home.desktop.html`),
    /Previous home/,
  );
  assert.match(
    await read(`${generation}/snapshots/after/screens/home.desktop.html`),
    /Current home/,
  );
  assert.match(
    await read(`${generation}/snapshots/before/styles.css`),
    /color: red/,
  );
  assert.match(
    await read(`${generation}/snapshots/after/styles.css`),
    /color: blue/,
  );
  for (const side of ["before", "after"]) {
    assert.deepEqual(
      await fs.promises.readFile(
        path.join(fixture.output, generation, "snapshots", side, "pixel.png"),
      ),
      await fs.promises.readFile(path.join(fixture.mockupsDir, "pixel.png")),
    );
  }
  assert.match(await read("index.html"), /href="\/view\/screens\/removed"/);
  assert.match(
    await read("index.html"),
    /data-entry-id="removed"[^>]*data-route="screens\/removed.html"/,
  );
  assert.match(
    await read("view/screens/removed.html"),
    /This screen was removed/,
  );
  assert.match(redirects, /\/id\/removed \/view\/screens\/removed 302/);
  assert.match(await read("_headers"), /Cache-Control: no-store/);
  assert.equal(
    fs.existsSync(path.join(fixture.output, generation, "summary.md")),
    false,
  );
  assert.equal(fs.existsSync(path.join(fixture.output, ".comparisons")), false);
  assert.equal(
    await fs.promises.readFile(
      path.join(fixture.config.review.outDir, "keep.txt"),
      "utf8",
    ),
    "another server's comparison\n",
  );

  await fixture.git("update-ref", "-d", "refs/remotes/origin/main");
  await assert.rejects(fixture.build, /preview comparison failed/);
  assert.equal(await read("_redirects"), redirects);
  assert.deepEqual(await fs.promises.readdir(path.dirname(fixture.output)), [
    "published",
  ]);
});

test("a published renamed screen keeps its current id redirect and old comparison route", async (context) => {
  const fixture = await createPreviewComparisonFixture();
  context.after(() => fixture.close());
  const source = await fs.promises.readFile(fixture.entryPath, "utf8");
  await fs.promises.writeFile(
    fixture.entryPath,
    source.replace(
      'route: "screens/home.html"',
      'route: "screens/renamed.html"',
    ),
  );
  await writeCompilation(
    await compileCatalogue(fixture.config),
    fixture.config,
  );
  await fixture.build();
  const redirects = await fs.promises.readFile(
    path.join(fixture.output, "_redirects"),
    "utf8",
  );
  assert.match(redirects, /\/id\/home \/view\/screens\/renamed 302/);
  assert.equal(redirects.match(/^\/id\/home /gm)?.length, 1);
  const old = await fs.promises.readFile(
    path.join(fixture.output, "view/screens/home.html"),
    "utf8",
  );
  assert.match(old, /This screen was removed/);
  assert.match(old, /data-diff-mode="side"/);
});
