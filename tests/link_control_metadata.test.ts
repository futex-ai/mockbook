import assert from "node:assert/strict";
import test from "node:test";

import { adaptLinkControls } from "../dist/build/link_controls.js";

const page = (body: string) =>
  `<!doctype html><html><head></head><body>${body}</body></html>`;
const wrap = (body: string) =>
  `<template data-mokabook-link-child-start="mock:details"></template>${body}<template data-mokabook-link-child-end=""></template>`;
const adapt = (body: string) => adaptLinkControls(page(body), "home.html");

test("mixed-case child markers are consumed using HTML attribute semantics", () => {
  const html = wrap("<button>Continue</button>").replaceAll(
    "data-mokabook-link-child-",
    "DATA-Mokabook-LINK-CHILD-",
  );
  const output = adapt(html);
  assert.match(output, /<a href="mock:details"/);
  assert.doesNotMatch(output, /data-mokabook-link-child-/i);
});

for (const html of [
  '<template DATA-MOKABOOK-LINK-CHILD-END=""></template>',
  '<span DATA-MOKABOOK-LINK-CHILD-START="mock:details">Bad</span>',
  '<template><template DATA-MOKABOOK-LINK-CHILD-END=""></template></template>',
]) {
  test(`mixed-case malformed markers fail: ${html}`, () => {
    assert.throws(() => adapt(html), /MockLink child control/);
  });
}

for (const metadata of [
  '<a data-mokabook-link-control="button">Unrelated</a>',
  '<a DATA-MOKABOOK-LINK-CONTROL="div">Unrelated</a>',
  '<style data-mokabook-link-control-styles="">a{color:red}</style>',
  '<div data-mokabook-link-control-future="">Reserved namespace</div>',
  '<template><a data-mokabook-link-control="span">Inert</a></template>',
  '<svg><a DATA-MOKABOOK-LINK-CONTROL="a">Foreign</a></svg>',
]) {
  for (const child of ["", wrap("<button>Continue</button>")]) {
    test(`authored metadata is reserved globally ${child ? "with" : "without"} child links: ${metadata}`, () => {
      assert.throws(
        () => adapt(metadata + child),
        /reserved adaptation metadata/,
      );
    });
  }
}

for (const tabindex of ["0", "3", "-1"]) {
  test(`tabindex ${tabindex} ancestors cannot enclose child links`, () => {
    assert.throws(
      () =>
        adapt(
          `<div tabindex="${tabindex}">${wrap("<button>Continue</button>")}</div>`,
        ),
      /interactive ancestor/,
    );
  });
}

const literal = [
  '<p data-example="data-mokabook-link-child-start">DATA-MOKABOOK-LINK-CONTROL</p>',
  '<!-- <template data-mokabook-link-child-end=""></template> -->',
  "<script>const sample = '<a DATA-MOKABOOK-LINK-CONTROL=\"a\">';</script>",
  '<style>.example::after{content:"data-mokabook-link-child-start"}</style>',
].join("\n");

test("literal metadata names remain ordinary bytes in unmarked documents", () => {
  assert.equal(adapt(literal), page(literal));
});

test("literal marker names remain unchanged alongside real child links", () => {
  const output = adapt(literal + wrap("<button>Continue</button>"));
  assert.ok(output.includes(literal));
  assert.match(output, /<a href="mock:details"/);
});
