import assert from "node:assert/strict";
import test from "node:test";

import {
  byClass,
  designDocument,
  textContent,
} from "./helpers/design_catalogue.js";

for (const viewport of ["mobile", "desktop"] as const) {
  test(`${viewport}: shared designs describe the complete catalogue`, async () => {
    const home = await designDocument("design-browse-home", viewport);
    assert.match(
      textContent(home.document),
      /choose an item from the navigation/,
    );
    const missing = await designDocument(
      "design-browse-missing-route",
      viewport,
    );
    assert.match(textContent(missing.document), /Item not found/);
    for (const id of [
      "design-browse-home",
      "design-browse-missing-route",
      "design-page-view",
    ]) {
      const { document } = await designDocument(id, viewport);
      const search = byClass(document, "mbk-search")[0];
      assert.ok(search);
      assert.match(textContent(search), /Search catalogue…/);
    }
  });
}
