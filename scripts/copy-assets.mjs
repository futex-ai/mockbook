// Copies package-owned shell assets and bundles the dependency-free navigation
// resize client as a classic script for served and static catalogues.
import fs from "node:fs";
import path from "node:path";

import { build } from "esbuild";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const source = path.join(repositoryRoot, "src", "server", "shell", "assets");
const target = path.join(repositoryRoot, "dist", "server", "shell", "assets");

await fs.promises.rm(target, { force: true, recursive: true });
await fs.promises.cp(source, target, { recursive: true });

await build({
  bundle: true,
  entryPoints: [path.join(repositoryRoot, "src", "client", "nav_resize.ts")],
  format: "iife",
  logLevel: "silent",
  outfile: path.join(repositoryRoot, "dist", "client", "navigation-resize.js"),
  platform: "browser",
  target: "es2023",
});
