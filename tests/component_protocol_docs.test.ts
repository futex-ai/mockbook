import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { compareReview } from "../dist/review/compare.js";
import { componentEntrySource } from "./helpers/component_fixture.js";
import { componentReviewFixture } from "./helpers/component_review_fixture.js";
import { repositoryRoot, validEntrySource } from "./helpers/fixture.js";

const read = (file: string) =>
  fs.readFile(path.join(repositoryRoot, file), "utf8");

test("documented catalogue formats match compilation and both comparison sides", async (t) => {
  const index = await read("docs/protocol/README.md");
  const plain = validEntrySource();
  const components = componentEntrySource();
  for (const [before, after] of [
    [plain, plain],
    [components, components],
    [plain, components],
    [components, plain],
  ]) {
    const fixture = await componentReviewFixture(t, () => after!, before!);
    const { result } = await compareReview(
      fixture.after,
      fixture.config,
      fixture.git,
      "main",
    );
    const componentComparison = before === components || after === components;
    assert.equal(
      fixture.after.manifest.schemaVersion,
      after === components ? 4 : 3,
    );
    assert.equal(result.schemaVersion, componentComparison ? 3 : 2);
    assert.match(
      index,
      after === components
        ? /With registered components\s*\|\s*4\s*\|\s*3/
        : /Without registered components\s*\|\s*3\s*\|\s*2/,
    );
  }
});

test("delivered component contracts do not retain superseded status or version instructions", async () => {
  for (const file of [
    "mokabook-components.md",
    "mokabook-changes.md",
    "mokabook-component-props.md",
    "mokabook-component-changes.md",
  ]) {
    const text = await read(`docs/protocol/${file}`);
    assert.doesNotMatch(
      text,
      /not available in the current package|is planned, not implemented|implementation TODOs|does not claim a shipped validator|raw-file logic must be integrated/,
      file,
    );
  }
  assert.doesNotMatch(
    await read("docs/protocol/mokabook-export.md"),
    /Keep `ReviewResult\.schemaVersion` at 2/,
  );
  assert.match(await read("README.md"), /primary file supports v3 and v4/);
});
