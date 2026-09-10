import assert from "node:assert/strict";
import { test } from "node:test";

import { generatedViews } from "../dist/components/views.js";
import { classifyComponents } from "../dist/review/component_classification.js";
import type { GitClient } from "../dist/review/git.js";
import { computeChangedRoutes } from "../dist/server/changed.js";
import { componentEntrySource } from "./helpers/component_fixture.js";
import { componentReviewFixture } from "./helpers/component_review_fixture.js";
import { validEntrySource } from "./helpers/fixture.js";

for (const baseline of ["screens", "components"] as const)
  test(`Serve batches every baseline view when adopting or updating components: ${baseline}`, async (t) => {
    const source = componentEntrySource();
    const fixture = await componentReviewFixture(
      t,
      () =>
        source.replace(
          "<button data-viewport=",
          '<button className="changed" data-viewport=',
        ),
      baseline === "screens" ? validEntrySource() : source,
    );
    const batches: string[][] = [];
    const git: GitClient = {
      ...fixture.git,
      readFiles: async (commit, paths) => {
        batches.push([...paths]);
        return new Map(
          await Promise.all(
            paths.map(
              async (route) =>
                [
                  route,
                  {
                    kind: "regular" as const,
                    bytes: await fixture.git.readFileBytes(commit, route),
                  },
                ] as const,
            ),
          ),
        );
      },
    };
    const expected = await computeChangedRoutes(
      fixture.config,
      "main",
      fixture.git,
    );
    assert.ok(expected);

    assert.deepEqual(
      await computeChangedRoutes(fixture.config, "main", git),
      expected,
    );
    const paths = fixture.before.manifest.entries.flatMap((entry) =>
      generatedViews(entry).map((view) => `mockups/${view.path}`),
    );
    assert.ok(paths.length >= 8);
    assert.equal(
      batches.length,
      1,
      "one logical Git batch for all saved views",
    );
    assert.deepEqual(batches[0], [...new Set(paths)].sort());
  });

test("shared classification batches both sides including removed dark variants", async (t) => {
  const fixture = await componentReviewFixture(t, (source) =>
    source.replace(
      ', { id: "disabled", title: "Disabled", props: { label: "Continue", disabled: true } }',
      "",
    ),
  );
  const readers = [fixture.before, fixture.after].map((compilation) => {
    const batches: string[][] = [];
    const reads: string[] = [];
    const read = async (route: string) => {
      const html = compilation.outputs.get(route);
      assert.notEqual(html, undefined, route);
      return Buffer.from(html!);
    };
    return {
      batches,
      reads,
      plain: { read },
      batched: {
        read: async (route: string) => {
          reads.push(route);
          return read(route);
        },
        readMany: async (routes: readonly string[]) => {
          batches.push([...routes]);
          return new Map(
            await Promise.all(
              routes.map(async (route) => [route, await read(route)] as const),
            ),
          );
        },
      },
    };
  });
  const [before, after] = readers;
  assert.ok(before && after);
  const input = {
    before: fixture.before.manifest,
    after: fixture.after.manifest,
    config: fixture.config,
    changedPaths: fixture.changedPaths,
    baseCommit: "a".repeat(40),
    baseRef: "main",
  };
  const expected = await classifyComponents({
    ...input,
    beforeReader: before.plain,
    afterReader: after.plain,
  });

  assert.deepEqual(
    await classifyComponents({
      ...input,
      beforeReader: before.batched,
      afterReader: after.batched,
    }),
    expected,
  );
  for (const [index, compilation] of [
    fixture.before,
    fixture.after,
  ].entries()) {
    const reader = readers[index]!;
    const paths = compilation.manifest.entries.flatMap((entry) =>
      generatedViews(entry).map((view) => view.path),
    );
    assert.equal(reader.batches.length, 1);
    assert.deepEqual(
      [...reader.batches[0]!].sort(),
      [...new Set(paths)].sort(),
    );
    assert.deepEqual(reader.reads, [], "prefetched fragments must stay cached");
  }
  assert.equal(
    expected.components.find((entry) => entry.id === "action")?.variants[1]
      ?.state,
    "removed",
  );
});
