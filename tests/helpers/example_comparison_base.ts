import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { repositoryRoot } from "./fixture.js";

const execute = promisify(execFile);
const manifestPath = "examples/basic/generated/mokabook-manifest.json";
const comparisonPaths = [
  "examples/basic/generated/design/review/outcomes/added.desktop.html",
  "examples/basic/generated/design/review/outcomes/added.mobile.html",
  "examples/basic/generated/screens/welcome.desktop.html",
  "examples/basic/generated/screens/welcome.mobile.html",
] as const;

/** Find a compatible ancestor that differs for every real comparison screen. */
export async function exampleComparisonBase(): Promise<string> {
  const { stdout } = await execute(
    "git",
    ["rev-list", "--first-parent", "HEAD"],
    { cwd: repositoryRoot },
  );
  const revisions = stdout.split(/\r?\n/u).filter(Boolean);
  for (const revision of revisions.slice(1)) {
    const manifest = await execute(
      "git",
      ["ls-tree", "--name-only", revision, "--", manifestPath],
      { cwd: repositoryRoot },
    );
    if (manifest.stdout.trim() !== manifestPath) continue;
    const changed = await execute(
      "git",
      ["diff", "--name-only", revision, "HEAD", "--", ...comparisonPaths],
      { cwd: repositoryRoot },
    );
    const changedPaths = new Set(changed.stdout.split(/\r?\n/u));
    if (comparisonPaths.every((file) => changedPaths.has(file)))
      return revision;
  }
  throw new Error(
    "Could not find a compatible historical base for example comparisons.",
  );
}
