import assert from "node:assert/strict";
import test from "node:test";

import {
  parseStaticDelivery,
  resolveDeliveryHref,
  validFragmentQuery,
} from "../dist/navigation/delivery.js";
import { readStaticDelivery } from "../dist/client/static_delivery.js";

const descriptor = {
  schemaVersion: 1,
  canonicalPath: "/view/screens/home.html",
  idRoutes: { home: "/view/screens/home.html" },
  comparisonUrl: `/__mokabook/diffs/__generations/${"a".repeat(64)}/review.json`,
};

test("static metadata never authorizes external URLs, traversal, or unknown ids", () => {
  const valid = parseStaticDelivery(descriptor);
  assert.ok(valid);
  assert.equal(
    resolveDeliveryHref("/id/home?fragment=heading", valid),
    "/view/screens/home.html?fragment=heading",
  );
  assert.equal(resolveDeliveryHref("/id/missing", valid), undefined);
  assert.equal(resolveDeliveryHref("/id/homeindex.html", valid), undefined);
  for (const path of [
    "//example.com/home.html",
    "/view/../secret.html",
    "/view/%2e%2e/secret.html",
    "/view/page.html?next=evil",
  ])
    assert.equal(
      parseStaticDelivery({ ...descriptor, idRoutes: { home: path } }),
      undefined,
    );
  assert.equal(
    parseStaticDelivery({
      ...descriptor,
      comparisonUrl: "https://example.com/review.json",
    }),
    undefined,
  );
  assert.equal(validFragmentQuery("?fragment=a&fragment=b"), "");
  assert.equal(validFragmentQuery("?fragment=%23bad"), "");
});

test("a static document with missing or malformed metadata never falls back to the server", () => {
  const document = (values: Record<string, string>) =>
    ({
      documentElement: { getAttribute: (key: string) => values[key] ?? null },
    }) as unknown as Document;
  assert.equal(readStaticDelivery(document({})), undefined);
  for (const contents of [undefined, "{}", "{"]) {
    const attrs: Record<string, string> = { "data-mokabook-static": "" };
    if (contents !== undefined) attrs["data-mokabook-delivery"] = contents;
    assert.throws(() => readStaticDelivery(document(attrs)), /unavailable/);
  }
  assert.deepEqual(
    readStaticDelivery(
      document({
        "data-mokabook-static": "",
        "data-mokabook-delivery": JSON.stringify(descriptor),
      }),
    ),
    parseStaticDelivery(descriptor),
  );
});
