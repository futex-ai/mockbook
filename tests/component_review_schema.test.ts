import assert from "node:assert/strict";
import { test } from "node:test";

import { compareReview } from "../dist/review/compare.js";
import { parseReviewResult } from "../dist/review/result_validation.js";
import { validateComponentReviewSources } from "../dist/review/component_result_sources.js";
import { componentReviewFixture } from "./helpers/component_review_fixture.js";

test("component comparison schemas reject invalid membership, sides, references and unknown fields", async (t) => {
  const fixture = await componentReviewFixture(t, (s) =>
    s.replace(
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
  assert.deepEqual(
    parseReviewResult(JSON.parse(JSON.stringify(result))),
    result,
  );
  validateComponentReviewSources(
    result,
    fixture.before.manifest,
    fixture.after.manifest,
  );
  for (const tamper of [
    (value: typeof result) =>
      Object.assign(value.changes[0]!, { unknown: true }),
    (value: typeof result) => Object.assign(value.changes[0]!, { reasons: [] }),
    (value: typeof result) =>
      Object.assign(value.changes[0]!, { before: undefined, after: undefined }),
    (value: typeof result) =>
      Object.assign(value.components[0]!.variants[0]!.views[0]!, {
        afterPath: "snapshots/after/../secret.html",
      }),
    (value: typeof result) =>
      Object.assign(value.affectedConsumers[0]!, {
        changedComponentId: "unknown",
      }),
    (value: typeof result) =>
      Object.assign(value.affectedConsumers[0]!.evidence[0]!.via[0]!, {
        instanceKey: "invalid",
      }),
    (value: typeof result) =>
      Object.assign(value.changes[0]!, {
        reasons: [{ kind: "dependency", path: "unchanged.txt" }],
      }),
  ]) {
    const value = structuredClone(result);
    tamper(value);
    assert.throws(
      () => parseReviewResult(JSON.parse(JSON.stringify(value))),
      /review/i,
    );
  }
  const invalidSource = structuredClone(result);
  Object.assign(invalidSource.affectedConsumers[0]!.evidence[0]!.via[0]!, {
    instanceKey: "a".repeat(64),
  });
  assert.throws(
    () =>
      validateComponentReviewSources(
        invalidSource,
        fixture.before.manifest,
        fixture.after.manifest,
      ),
    /review/i,
  );
});
