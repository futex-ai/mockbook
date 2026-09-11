import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import { NodeGitCommandRunner } from "../dist/review/git.js";

test("the Git runner aborts an active subprocess", async () => {
  const controller = new AbortController();
  const runner = new NodeGitCommandRunner(process.cwd(), controller.signal);
  const command = runner.run(["cat-file", "--batch"]);

  await delay(25);
  controller.abort();

  await assert.rejects(command, { name: "AbortError" });
});
