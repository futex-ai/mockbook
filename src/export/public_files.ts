import fs from "node:fs";
import path from "node:path";

import { isInside, toPosixPath } from "../config/paths.js";
import { isPublicStaticFile } from "../config/public_files.js";
import type { ResolvedConfig } from "../config/types.js";
import { exportError } from "./error.js";

const PRIVATE_DIRECTORIES = new Set([
  "node_modules",
  "target",
  "dist",
  "coverage",
  "test-results",
  "playwright-report",
]);

/** Public resource names never include hidden paths or source/config modules. */
export function isExportPublicName(name: string): boolean {
  return (
    !name
      .split("/")
      .some((part) => part.startsWith(".") || PRIVATE_DIRECTORIES.has(part)) &&
    !/\.(?:[cm]?[jt]sx?|map)$/i.test(name)
  );
}

/** Capture ordinary public bytes once, rejecting selected symlinks explicitly. */
export async function capturePublicFiles(
  config: ResolvedConfig,
): Promise<ReadonlyMap<string, Buffer>> {
  const files = new Map<string, Buffer>();
  const excluded = [
    config.entriesDir,
    ...(config.legacy ? [config.legacy.pagesDir] : []),
    config.review.outDir,
  ];
  const excludedFiles = [
    config.configPath,
    config.renderer,
    config.legacy?.components,
    config.compatibility.transformer,
  ];
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await fs.promises.readdir(directory, {
      withFileTypes: true,
    })) {
      const candidate = path.join(directory, entry.name);
      const name = toPosixPath(path.relative(config.mockupsDir, candidate));
      if (
        !isExportPublicName(name) ||
        excluded.some((root) => isInside(root, candidate)) ||
        excludedFiles.includes(candidate)
      )
        continue;
      if (entry.isSymbolicLink())
        throw exportError(`Public export resource is a symlink: ${name}`);
      if (entry.isDirectory()) await visit(candidate);
      else if (entry.isFile() && isPublicStaticFile(candidate, config))
        files.set(name, await fs.promises.readFile(candidate));
      else
        throw exportError(
          `Public export resource is not a regular file: ${name}`,
        );
    }
  };
  await visit(config.mockupsDir);
  return new Map(
    [...files].sort(([left], [right]) => left.localeCompare(right)),
  );
}
