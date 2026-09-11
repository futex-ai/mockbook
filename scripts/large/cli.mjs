import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import {
  generateLargeFixture,
  largeSize,
} from "../../tests/fixtures/large/generate.ts";
import { start, stop, waitFor } from "./process.mjs";
import { waitForBrowseChanges } from "./browse.mjs";

const run = promisify(execFile);
const repository = path.resolve(import.meta.dirname, "../..");
const bin = path.join(repository, "dist/cli/bin.js");

async function main() {
  const args = process.argv.slice(2);
  const mode = args.shift();
  if (!["generate", "serve", "benchmark"].includes(mode))
    throw new Error(
      "Use generate, serve or benchmark, with optional --areas, --screens, --rows, --debug-timings",
    );
  const size = {};
  let debug = mode === "benchmark";
  while (args.length) {
    const flag = args.shift();
    if (flag === "--debug-timings") debug = true;
    else if (["--areas", "--screens", "--rows"].includes(flag)) {
      const value = args.shift();
      if (!value || value.startsWith("--"))
        throw new Error(`${flag} needs a value`);
      size[flag.slice(2)] = Number(value);
    } else throw new Error(`Unknown fixture option: ${flag}`);
  }
  largeSize(size);
  const context = path.join(repository, ".context");
  await fs.mkdir(context, { recursive: true });
  const root = await fs.mkdtemp(path.join(context, "mokabook-large-"));
  const fixture = await generateLargeFixture(root, size);
  process.stdout.write(
    `Large fixture: ${fixture.routes} routes, ${fixture.documents} documents\n${root}\nPreparing the generated Git baseline…\n`,
  );
  const baseline = start(
    [
      bin,
      "build",
      "--config",
      fixture.configPath,
      ...(debug ? ["--debug-timings"] : []),
    ],
    root,
  );
  const forwardBaseline = () => void stop(baseline);
  process.once("SIGINT", forwardBaseline);
  process.once("SIGTERM", forwardBaseline);
  try {
    await baseline.done;
  } finally {
    process.off("SIGINT", forwardBaseline);
    process.off("SIGTERM", forwardBaseline);
  }
  if (baseline.child.signalCode !== null) return;
  const git = (...argv) => run("git", argv, { cwd: root });
  await git("init", "-q", "-b", "main");
  await git("config", "user.name", "Mokabook Fixture");
  await git("config", "user.email", "fixture@example.invalid");
  await git("add", ".");
  await git(
    "-c",
    "core.hooksPath=/dev/null",
    "commit",
    "-qm",
    "test: large catalogue baseline",
  );
  process.stdout.write(
    `Baseline ready. Reuse with:\nnode dist/cli/bin.js serve --config ${fixture.configPath} --debug-timings\n`,
  );
  if (mode === "generate") return;
  const started = performance.now();
  const running = start(
    [
      bin,
      "serve",
      "--config",
      fixture.configPath,
      "--port",
      "0",
      ...(debug ? ["--debug-timings"] : []),
    ],
    root,
  );
  const forward = () => void stop(running);
  process.once("SIGINT", forward);
  process.once("SIGTERM", forward);
  try {
    if (mode === "serve") await running.done;
    else {
      const match = await waitFor(
        running,
        /Mokabook listening at (http:\/\/127\.0\.0\.1:\d+)/,
      );
      const readinessMs = Math.round(performance.now() - started);
      const changesReady = waitFor(running, /"stage":"changes.publish"/).then(
        async () => {
          await waitForBrowseChanges(match[1]);
          return Math.round(performance.now() - started);
        },
      );
      void changesReady.catch(() => {});
      const requests = [];
      for (const route of [
        "/",
        "/view/area-1/screens/activity-1.html",
        "/view/area-1/components/action.html",
        "/view/area-1/guide.html",
        "/static/assets/mark.svg",
      ]) {
        const beginning = performance.now();
        const response = await fetch(match[1] + route, {
          signal: AbortSignal.timeout(60000),
        });
        if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
        const bytes = (await response.arrayBuffer()).byteLength;
        requests.push({
          route,
          bytes,
          durationMs: Math.round(performance.now() - beginning),
        });
      }
      const changesReadyMs = await changesReady;
      process.stdout.write(
        `Benchmark ${JSON.stringify({ ...fixture, readinessMs, changesReadyMs, requests })}\n`,
      );
    }
  } finally {
    await stop(running);
    process.off("SIGINT", forward);
    process.off("SIGTERM", forward);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
