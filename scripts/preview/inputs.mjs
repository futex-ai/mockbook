import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { isInside, projectRealPath } from "../../dist/config/paths.js";
import { MANIFEST_NAME, parseManifest } from "../../dist/registry/manifest.js";

/** Capture metadata and its exact input digest together, including private helpers. */
export async function capturePublicationInputs(config, excludedRoots) {
  const excluded = excludedRoots.map(projectRealPath);
  const files = new Set();
  async function visit(directory, publicRoot = false) {
    const entries = await fs.promises.readdir(directory, {
      withFileTypes: true,
    });
    for (const entry of entries) {
      const file = path.join(directory, entry.name);
      if (
        isComparisonPath(file, config) ||
        [".git", "node_modules", "target"].includes(entry.name) ||
        (!publicRoot && entry.name === ".context")
      )
        continue;
      const real = projectRealPath(file);
      if (excluded.some((root) => isInside(root, real))) continue;
      if (entry.isDirectory()) await visit(file, publicRoot);
      else if (entry.isFile() || entry.isSymbolicLink()) files.add(file);
    }
  }
  await visit(config.repoRoot);
  await visit(config.mockupsDir, true);
  const manifestFile = path.join(config.mockupsDir, MANIFEST_NAME);
  const manifestBytes = await fs.promises.readFile(manifestFile);
  const manifest = parseManifest(JSON.parse(manifestBytes.toString("utf8")));
  files.add(manifestFile);
  for (const source of [
    ...manifest.sourceFiles,
    ...(config.configSourceFiles ?? []),
  ])
    files.add(path.resolve(config.repoRoot, source));
  const hash = crypto.createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(path.relative(config.repoRoot, file));
    hash.update("\0");
    const stat = await fs.promises.lstat(file);
    if (stat.isSymbolicLink()) hash.update(await fs.promises.readlink(file));
    if ((await fs.promises.stat(file)).isFile())
      hash.update(
        file === manifestFile
          ? manifestBytes
          : await fs.promises.readFile(file),
      );
    hash.update("\0");
  }
  return { fingerprint: hash.digest("hex"), manifest };
}

/** Exclude old comparison output even when it sits inside public assets. */
export function isComparisonPath(file, config) {
  if (
    file === config.review.outDir ||
    file.startsWith(`${config.review.outDir}${path.sep}`)
  )
    return true;
  let directory = path.dirname(file);
  while (
    directory !== config.mockupsDir &&
    directory !== path.dirname(directory)
  ) {
    if (
      fs.existsSync(path.join(directory, ".mokabook-review-artifact")) ||
      fs.existsSync(path.join(directory, ".mokabook-preview-artifact"))
    )
      return true;
    directory = path.dirname(directory);
  }
  const relative = path.relative(config.mockupsDir, file).split(path.sep);
  return (
    relative.includes(".comparisons") ||
    (relative.includes("__mokabook") && relative.includes("diffs"))
  );
}
