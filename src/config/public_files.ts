import fs from "node:fs";
import path from "node:path";

import { isAuthoringSource } from "../build/source_inventory.js";
import { LEGACY_MANIFEST_NAME, MANIFEST_NAME } from "../registry/manifest.js";
import { isInside, projectRealPath } from "./paths.js";
import type { ResolvedConfig } from "./types.js";

/** Catalogue manifests are internal even when requested through another path. */
export function isInternalCatalogueFile(
  candidate: string,
  config: ResolvedConfig,
): boolean {
  const internal = [MANIFEST_NAME, LEGACY_MANIFEST_NAME].map((name) =>
    path.join(config.mockupsDir, name),
  );
  if (internal.includes(candidate)) return true;
  const realCandidate = projectRealPath(candidate);
  return internal.some(
    (file) => fs.existsSync(file) && realCandidate === fs.realpathSync(file),
  );
}

/** Shared denial policy for generated references, HTTP, export, and Review. */
export function isPrivateStaticPath(
  candidate: string,
  config: ResolvedConfig,
): boolean {
  return (
    isInternalCatalogueFile(candidate, config) ||
    isAuthoringSource(candidate, config)
  );
}

/** Return whether a path names a public regular file beneath the output root. */
export function isPublicStaticFile(
  candidate: string,
  config: ResolvedConfig,
): boolean {
  try {
    if (
      !isInside(config.mockupsDir, candidate) ||
      isPrivateStaticPath(candidate, config)
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
