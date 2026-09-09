import fs from "node:fs";

import { isAuthoringSource } from "../build/source_inventory.js";
import { isInside } from "./paths.js";
import type { ResolvedConfig } from "./types.js";

/** Return whether a path names a public regular file beneath the output root. */
export function isPublicStaticFile(
  candidate: string,
  config: ResolvedConfig,
): boolean {
  try {
    if (
      !isInside(config.mockupsDir, candidate) ||
      isAuthoringSource(candidate, config)
    ) {
      return false;
    }
    if (!fs.statSync(candidate).isFile()) return false;
    const realRepoRoot = fs.realpathSync(config.repoRoot);
    const realRoot = fs.realpathSync(config.mockupsDir);
    const realCandidate = fs.realpathSync(candidate);
    const sourceRoots = [fs.realpathSync(config.entriesDir)];
    return (
      isInside(realRepoRoot, realRoot) &&
      isInside(realRoot, realCandidate) &&
      !sourceRoots.some((root) => isInside(root, realCandidate))
    );
  } catch {
    return false;
  }
}
