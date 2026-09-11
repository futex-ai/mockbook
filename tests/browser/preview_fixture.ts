import { execFile, spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";

import { exampleComparisonBase } from "../helpers/example_comparison_base.js";
import { repositoryRoot } from "../helpers/fixture.js";

const execute = promisify(execFile);

/** Running Cloudflare Pages preview used by browser integration tests. */
export interface PreviewFixture {
  url: string;
  close(): Promise<void>;
}

/** Build the static artifact and serve it with query-preserving Pages routes. */
export async function startPreviewFixture(
  options: { comparisons?: boolean } = {},
): Promise<PreviewFixture> {
  if (options.comparisons) await buildComparisonPreview();
  else await execute("npm", ["run", "preview:build"], { cwd: repositoryRoot });
  return await servePreviewFixture(
    path.join(repositoryRoot, ".context/mokabook-preview"),
  );
}

async function buildComparisonPreview(): Promise<void> {
  await execute("npm", ["run", "build"], { cwd: repositoryRoot });
  await execute("npm", ["run", "example:build"], { cwd: repositoryRoot });
  const base = await exampleComparisonBase();
  const output = path.join(repositoryRoot, ".context/mokabook-preview");
  await execute(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'import { loadConfig } from "./dist/config/load.js"; import { buildPreview } from "./scripts/preview/catalogue.mjs"; const config = await loadConfig(process.argv[1], process.argv[2]); await buildPreview(config, process.argv[3], process.argv[4]);',
      repositoryRoot,
      path.join(repositoryRoot, "examples/basic/mokabook.config.ts"),
      output,
      base,
    ],
    { cwd: repositoryRoot },
  );
}

/** Serve an already-published fixture through the real Pages routing runtime. */
export async function servePreviewFixture(
  artifact: string,
): Promise<PreviewFixture> {
  const port = await availablePort();
  const child = spawn(
    process.execPath,
    [
      path.join(repositoryRoot, "node_modules/wrangler/bin/wrangler.js"),
      "pages",
      "dev",
      artifact,
      "--compatibility-date",
      "2026-07-28",
      "--ip",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: repositoryRoot, stdio: ["ignore", "pipe", "pipe"] },
  );
  const output: string[] = [];
  child.stdout?.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  child.stderr?.on("data", (chunk: Buffer) => output.push(chunk.toString()));
  const url = `http://127.0.0.1:${port}`;
  await waitUntilReady(child, url, output);
  return { close: () => stop(child), url };
}

async function availablePort(): Promise<number> {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  if (!address || typeof address === "string") {
    throw new Error("preview test could not allocate a TCP port");
  }
  return address.port;
}

async function waitUntilReady(
  child: ChildProcess,
  url: string,
  output: readonly string[],
): Promise<void> {
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`preview exited before startup: ${output.join("")}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The port is expected to refuse connections until workerd is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  await stop(child);
  throw new Error(`preview did not start: ${output.join("")}`);
}

async function stop(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise<void>((resolve) => child.once("exit", resolve));
  child.kill("SIGTERM");
  const timeout = new Promise<"timeout">((resolve) =>
    setTimeout(() => resolve("timeout"), 5_000),
  );
  if (
    (await Promise.race([exited.then(() => "exit" as const), timeout])) ===
    "timeout"
  ) {
    child.kill("SIGKILL");
    await exited;
  }
}
