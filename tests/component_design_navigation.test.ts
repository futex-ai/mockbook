import assert from "node:assert/strict";
import test from "node:test";

import {
  COMPONENT_PAGES,
  INSPECTION_PAGES,
} from "../examples/basic/entries/design/components/parts/destinations.js";
import {
  attribute,
  byClass,
  designDocument,
  elements,
} from "./helpers/design_catalogue.js";

for (const viewport of ["mobile", "desktop"] as const) {
  test(`${viewport}: component controls preserve their own scenario after shell integration`, async () => {
    const destinations = [
      ...Object.values(COMPONENT_PAGES),
      ...Object.values(INSPECTION_PAGES),
    ];
    assert.equal(new Set(destinations).size, 18);
    for (const id of destinations) {
      const { document } = await designDocument(id, viewport);
      assert.equal(
        attribute(byClass(document, "mbk-brand")[0]!, "data-mokabook-link"),
        "design-browse-home",
        id,
      );
      const toolbar = byClass(document, "mbk-cmp-toolbar")[0];
      assert.ok(toolbar, id);
      assert.equal(elements(toolbar, (node) => node.tagName === "a").length, 0);
      const buttons = elements(toolbar, (node) => node.tagName === "button");
      assert.equal(buttons.length, 4, id);
      assert.equal(
        buttons.filter((node) => attribute(node, "aria-pressed") === "true")
          .length,
        1,
        id,
      );
      assert.equal(
        attribute(byClass(document, "mbk-search-tag")[0]!, "href"),
        undefined,
        id,
      );
      if (viewport === "mobile") {
        assert.equal(
          attribute(
            byClass(document, "mbk-menu-btn")[0]!,
            "data-mokabook-link",
          ),
          "design-browse-navigation",
          id,
        );
      }
    }
  });
}
