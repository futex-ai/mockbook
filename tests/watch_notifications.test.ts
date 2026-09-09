import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  rawRenamePaths,
  ResourceWatchNotifications,
} from "../dist/server/watch_notifications.js";

test("raw replacements identify only named watched resources, including file and directory notifications", () => {
  const directory = path.resolve("mockups/assets");
  const image = path.join(directory, "image.svg");
  const ignore = (candidate: string) => candidate !== image;
  for (const watchedPath of [directory, image]) {
    assert.deepEqual(rawRenamePaths("image.svg", { watchedPath }, ignore), [
      image,
    ]);
    assert.deepEqual(rawRenamePaths(image, { watchedPath }, ignore), [image]);
    assert.deepEqual(
      rawRenamePaths("generated.html", { watchedPath }, ignore),
      [],
    );
  }
});

test("unnamed raw events do not invent an entry or reload its parent", () => {
  for (const raw of [null, undefined, ""]) {
    assert.deepEqual(
      rawRenamePaths(raw, { watchedPath: path.resolve("mockups") }),
      [],
    );
  }
  assert.deepEqual(rawRenamePaths("image.svg", undefined), []);
});

test("normalized and raw events coalesce and shutdown cancels delayed notifications", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const changes: string[] = [];
  const notifications = new ResourceWatchNotifications((candidate) =>
    changes.push(candidate),
  );
  notifications.notify("image.svg");
  context.mock.timers.tick(50);
  notifications.notify("image.svg");
  context.mock.timers.tick(74);
  assert.deepEqual(changes, []);
  context.mock.timers.tick(1);
  assert.deepEqual(changes, ["image.svg"]);
  notifications.notify("font.woff2");
  notifications.close();
  context.mock.timers.tick(100);
  assert.deepEqual(changes, ["image.svg"]);
});
