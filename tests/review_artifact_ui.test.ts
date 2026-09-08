import assert from "node:assert/strict";
import test from "node:test";

import { renderReviewArtifact } from "../dist/review/artifact.js";
import type { ReviewResult } from "../dist/review/types.js";

const result: ReviewResult = {
  baseCommit: "a".repeat(40),
  baseRef: "origin/main",
  changedPaths: [],
  ignoredImpact: [],
  schemaVersion: 2,
  sharedImpact: ["styles.css"],
  screens: [
    {
      dependencies: [],
      id: "home",
      route: "screens/home.html",
      title: "Home",
      state: "unchanged",
      sharedImpact: ["styles.css"],
      views: [
        {
          colorScheme: "light",
          viewport: "mobile",
          state: "unchanged",
          ignoredIds: [],
          beforePath: "snapshots/base/home.html",
          afterPath: "snapshots/head/home.html",
        },
      ],
    },
  ],
};

test("comparison artifacts contain data and snapshots without a separate UI", () => {
  const snapshots = new Map([
    ["snapshots/base/home.html", "<main>Before</main>"],
    ["snapshots/head/home.html", "<main>After</main>"],
  ]);
  const files = renderReviewArtifact({ files: snapshots, result });
  assert.deepEqual(JSON.parse(String(files.get("review.json"))), result);
  assert.equal(
    files.get("snapshots/base/home.html"),
    snapshots.get("snapshots/base/home.html"),
  );
  assert.deepEqual([...files.keys()].sort(), [
    ".mokabook-review-artifact",
    "review.json",
    "snapshots/base/home.html",
    "snapshots/head/home.html",
    "summary.md",
  ]);
  assert.match(String(files.get("summary.md")), /impacted: 1/);
});

test("empty comparisons still return a valid result", () => {
  const empty = { ...result, screens: [], sharedImpact: [] };
  const files = renderReviewArtifact({ files: new Map(), result: empty });
  assert.deepEqual(JSON.parse(String(files.get("review.json"))), empty);
  assert.match(String(files.get("summary.md")), /Screens: 0/);
});
