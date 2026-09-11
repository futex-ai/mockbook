import assert from "node:assert/strict";
import test from "node:test";

import { waitForBrowseChanges } from "../scripts/large/browse.mjs";

test("benchmark waits for Changes delivery, not just parent classification", async (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    return new Response(
      requests < 3
        ? "<main>Browse</main>"
        : '<button data-mokabook-filter="changes">Changes</button>',
    );
  });
  await waitForBrowseChanges("http://fixture.invalid", 3000);
  assert.equal(requests, 3);
});

test("benchmark rejects failed Browse requests rather than reporting success", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("Failed", { status: 500 }),
  );
  await assert.rejects(
    waitForBrowseChanges("http://fixture.invalid", 3000),
    /HTTP 500/,
  );
});
