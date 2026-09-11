import assert from "node:assert/strict";
import test from "node:test";

import {
  childUpdateMessage,
  parseChildUpdateMessage,
} from "../dist/server/update_messages.js";

test("watch update messages preserve available and unavailable route state", () => {
  assert.deepEqual(childUpdateMessage(2, ["screens/home.html"]), {
    changedRoutes: ["screens/home.html"],
    componentChanges: null,
    type: "update",
    version: 2,
  });
  assert.deepEqual(childUpdateMessage(3, undefined), {
    changedRoutes: null,
    componentChanges: null,
    type: "update",
    version: 3,
  });
  assert.deepEqual(
    parseChildUpdateMessage({
      changedRoutes: [],
      componentChanges: null,
      type: "update",
      version: 4,
    }),
    {
      changedRoutes: [],
      componentChanges: null,
      type: "update",
      version: 4,
    },
  );
});

test("watch update parsing rejects incomplete or unsafe IPC values", () => {
  for (const value of [
    null,
    { changedRoutes: null, componentChanges: null, type: "reload", version: 2 },
    { changedRoutes: null, componentChanges: null, type: "update", version: 0 },
    {
      changedRoutes: null,
      componentChanges: null,
      type: "update",
      version: 1.5,
    },
    {
      changedRoutes: undefined,
      componentChanges: null,
      type: "update",
      version: 2,
    },
    {
      changedRoutes: ["../home.html"],
      componentChanges: null,
      type: "update",
      version: 2,
    },
    { changedRoutes: [42], componentChanges: null, type: "update", version: 2 },
    { changedRoutes: null, type: "update", version: 2 },
  ]) {
    assert.equal(parseChildUpdateMessage(value), undefined);
  }
});
