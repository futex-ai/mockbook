import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  NodeChildFactory,
  type ChildFactory,
  type ChildHandle,
} from "../dist/server/child_process.js";
import { ReadyProcessSupervisor } from "../dist/server/supervisor.js";
import { createFixture, removeFixture } from "./helpers/fixture.js";
import { settle } from "./helpers/supervised_child.js";

test(
  "a transport failure force-kills an unresponsive server before reusing its port",
  { timeout: 10_000 },
  async (context) => {
    const fixture = await createFixture();
    const script = path.join(fixture.root, "unresponsive-child.mjs");
    await fs.writeFile(
      script,
      `import http from "node:http";
process.on("SIGTERM", () => {});
process.on("message", () => {});
const portIndex = process.argv.indexOf("--port");
const port = Number(process.argv[portIndex + 1]);
const server = http.createServer((_request, response) => response.end("running"));
server.listen(port, "127.0.0.1", () => process.send({ type: "ready", port: server.address().port }));
`,
    );
    const factory = new FaultInjectingFactory(new NodeChildFactory(script));
    context.after(async () => {
      for (const child of factory.children) {
        if (!child.exited) child.handle.forceKill();
        await child.finished;
      }
      await removeFixture(fixture);
    });
    const supervisor = new ReadyProcessSupervisor(factory, [], 0, {
      gracefulMilliseconds: 30,
      terminateMilliseconds: 30,
    });
    const failures: Error[] = [];
    supervisor.onUnexpectedExit((error) => failures.push(error));
    const port = await supervisor.start();
    assert.equal(
      await (await fetch(`http://127.0.0.1:${port}`)).text(),
      "running",
    );
    const first = factory.children[0]!;
    first.fail?.(new Error("injected transport failure"));
    await supervisor.close();
    assert.equal(
      first.exited,
      true,
      "failed-child close must retain the live OS process",
    );
    assert.equal(first.terminations, 1);
    assert.equal(first.forceKills, 1);
    assert.equal(failures.length, 1);
    let replayed = false;
    first.handle.onExit(() => {
      replayed = true;
    });
    await settle();
    assert.equal(replayed, true, "late cleanup sees retained terminal state");

    assert.equal(await supervisor.start(), port);
    assert.equal(factory.children.length, 2);
    assert.equal((await fetch(`http://127.0.0.1:${port}`)).status, 200);
    await supervisor.close();
    assert.equal(factory.children[1]!.exited, true);
  },
);

interface ObservedChild {
  exited: boolean;
  fail?: (error: Error) => void;
  finished: Promise<void>;
  forceKills: number;
  handle: ChildHandle;
  terminations: number;
}

/** Inject only a transport error; process startup, signals, exit, and HTTP remain real. */
class FaultInjectingFactory implements ChildFactory {
  readonly children: ObservedChild[] = [];

  constructor(private readonly native: ChildFactory) {}

  spawn(args: readonly string[]): ChildHandle {
    const handle = this.native.spawn(args);
    let finish: () => void = () => undefined;
    const child: ObservedChild = {
      exited: false,
      finished: new Promise((resolve) => {
        finish = resolve;
      }),
      forceKills: 0,
      handle,
      terminations: 0,
    };
    this.children.push(child);
    handle.onExit(() => {
      child.exited = true;
      finish();
    });
    return {
      forceKill() {
        child.forceKills++;
        handle.forceKill();
      },
      onError(callback) {
        child.fail = callback;
        handle.onError(callback);
      },
      onExit: (callback) => handle.onExit(callback),
      onMessage: (callback) => handle.onMessage(callback),
      send: (message) => handle.send(message),
      terminate() {
        child.terminations++;
        handle.terminate();
      },
    };
  }
}
