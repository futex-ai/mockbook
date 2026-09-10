import { isDeepStrictEqual } from "node:util";

import { compileCatalogue, type Compilation } from "../build/compile.js";
import { loadConfig } from "../config/load.js";
import type { ResolvedConfig } from "../config/types.js";
import type { OptionalReviewAssetReader } from "../review/assets.js";
import type { GitClient } from "../review/git.js";
import { reviewChangedPaths } from "../review/changed_paths.js";
import { exportError } from "./error.js";
import { capturePublicFiles } from "./public_files.js";

/** Share captured public bytes between comparison and Changes calculations. */
export function capturedAssetReader(
  files: ReadonlyMap<string, Buffer>,
): OptionalReviewAssetReader {
  return {
    read: async (name) => {
      const bytes = files.get(name);
      if (!bytes)
        throw exportError(`Comparison resource is not exportable: ${name}`);
      return bytes;
    },
    readIfExists: async (name) => files.get(name),
  };
}

/** Pin branch identity and changed-path evidence for every comparison consumer. */
export function pinnedGit(
  git: GitClient,
  commit: string,
  changed: readonly string[],
): GitClient {
  return {
    mergeBase: async () => commit,
    changedPaths: async () => changed,
    fileExists: (base, name) => git.fileExists(base, name),
    fileKind: (base, name) => git.fileKind(base, name),
    readFile: (base, name) => git.readFile(base, name),
    readFileBytes: (base, name) => git.readFileBytes(base, name),
    ...(git.readFiles
      ? {
          readFiles: (base: string, names: readonly string[]) =>
            git.readFiles!(base, names),
        }
      : {}),
  };
}

/** Recheck effective source/config, public bytes, and evidence before installation. */
export async function assertInputsUnchanged(
  config: ResolvedConfig,
  compilation: Compilation,
  publicFiles: ReadonlyMap<string, Buffer>,
  git: GitClient,
  commit: string,
  changed: readonly string[],
  exclusions: readonly string[],
): Promise<void> {
  const freshConfig = await loadConfig(config.repoRoot, config.configPath);
  const fresh = await compileCatalogue(freshConfig);
  const publicNow = await capturePublicFiles(freshConfig);
  const changedNow = await reviewChangedPaths(
    git,
    commit,
    config,
    config.review.outDir,
    exclusions,
  );
  if (
    !isDeepStrictEqual(config, freshConfig) ||
    !isDeepStrictEqual(compilation, fresh) ||
    !isDeepStrictEqual(publicFiles, publicNow) ||
    !isDeepStrictEqual(changed, changedNow)
  )
    throw exportError(
      "Export inputs changed during generation; retry the export.",
    );
}
