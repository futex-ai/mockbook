/** Preserve access to removed screens without generating comparison snapshots. */

import type { ResolvedConfig } from "../config/types.js";
import type { ManifestScreen, Manifest } from "../registry/types.js";
import { readBaseManifest } from "../review/base_manifest.js";
import { NodeGitCommandRunner, RepositoryGitClient } from "../review/git.js";

/** Read only baseline metadata for screens absent from the current catalogue. */
export async function removedScreens(
  config: ResolvedConfig,
  manifest: Manifest,
  base: string,
): Promise<readonly ManifestScreen[]> {
  try {
    const git = new RepositoryGitClient(
      new NodeGitCommandRunner(config.repoRoot),
    );
    const commit = await git.mergeBase(base, "HEAD");
    const baseline = await readBaseManifest(git, commit, config);
    const routes = new Set(
      manifest.entries.flatMap((entry) =>
        entry.kind === "collection" ? [] : [entry.route],
      ),
    );
    return baseline.entries.filter(
      (entry): entry is ManifestScreen =>
        entry.kind === "screen" && !routes.has(entry.route),
    );
  } catch {
    return [];
  }
}
