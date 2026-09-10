/** Read-only material output checks for the catalogue Changes filter. */

import path from "node:path";

import { isInside, toPosixPath } from "../config/paths.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError } from "../errors.js";
import { LEGACY_MANIFEST_NAME, MANIFEST_NAME } from "../registry/manifest.js";
import type { ManifestV3 } from "../registry/types.js";
import { VIEWPORTS } from "../registry/views.js";
import {
  FileSystemReviewAssetReader,
  GitReviewAssetReader,
  type OptionalReviewAssetReader,
} from "../review/assets.js";
import type { GitClient } from "../review/git.js";
import {
  normalizeReviewPair,
  normalizeSingleDocument,
} from "../review/ignore.js";
import { fragmentForView, unionColorSchemes } from "../review/screen_views.js";
import { ChangedResourceGraph } from "./changed_resources.js";

interface FragmentPair {
  base?: string;
  head: string;
  context: string;
  changed: boolean;
}

/** Find material output changes, using live files or an injected captured reader. */
export async function changedContentPaths(
  manifest: ManifestV3,
  baseline: ManifestV3,
  config: ResolvedConfig,
  git: GitClient,
  commit: string,
  changedPaths: readonly string[],
  headReader: OptionalReviewAssetReader = new FileSystemReviewAssetReader(
    config,
  ),
): Promise<readonly string[]> {
  const prefix = toPosixPath(path.relative(config.repoRoot, config.mockupsDir));
  const repoPath = (route: string) => (prefix ? `${prefix}/${route}` : route);
  const publicChanges = new Set(
    changedPaths.flatMap((changed) => {
      const candidate = path.resolve(config.repoRoot, changed);
      if (
        !isInside(config.mockupsDir, candidate) ||
        isInside(config.entriesDir, candidate) ||
        (config.legacy && isInside(config.legacy.pagesDir, candidate))
      )
        return [];
      const route = toPosixPath(path.relative(config.mockupsDir, candidate));
      return route === MANIFEST_NAME || route === LEGACY_MANIFEST_NAME
        ? []
        : [route];
    }),
  );
  if (publicChanges.size === 0) return [];
  const pairs = fragmentPairs(manifest, baseline, publicChanges);
  const baseReader = new GitReviewAssetReader(config, git, commit, prefix);
  const result = new Set<string>();
  const documents = new Map<string, string>();
  const changedPairs = pairs.filter(
    (pair): pair is FragmentPair & { base: string } =>
      pair.changed && pair.base !== undefined,
  );
  for (let offset = 0; offset < changedPairs.length; offset += 32) {
    const batch = changedPairs.slice(offset, offset + 32);
    const bases = await baseReader.readMany(batch.map((pair) => pair.base));
    for (const pair of batch) {
      const base = bases.get(pair.base);
      if (!base) {
        throw new MokabookError(
          "review-invalid",
          `base fragment is missing: ${pair.base}`,
        );
      }
      const before = Buffer.from(base).toString("utf8");
      const after = Buffer.from(await headReader.read(pair.head)).toString(
        "utf8",
      );
      const normalized = normalizeReviewPair(before, after, pair.context);
      documents.set(pair.head, normalized.head);
      if (normalized.base !== normalized.head) {
        result.add(repoPath(pair.head));
      } else if (pair.base === pair.head) {
        publicChanges.delete(pair.head);
      }
    }
  }
  if (publicChanges.size === 0) return [...result].sort();
  const resources = new ChangedResourceGraph(
    headReader,
    baseReader,
    publicChanges,
    documents,
  );
  for (const pair of pairs) {
    let document = documents.get(pair.head);
    if (document === undefined) {
      const after = Buffer.from(await headReader.read(pair.head)).toString(
        "utf8",
      );
      document = pair.base
        ? normalizeReviewPair(after, after, pair.context).head
        : normalizeSingleDocument(after, pair.context);
    }
    if (await resources.affects(pair.head, document))
      result.add(repoPath(pair.head));
  }
  return [...result].sort();
}

function fragmentPairs(
  manifest: ManifestV3,
  baseline: ManifestV3,
  changed: ReadonlySet<string>,
): FragmentPair[] {
  const bases = new Map(baseline.entries.map((entry) => [entry.id, entry]));
  const pairs: FragmentPair[] = [];
  for (const screen of manifest.entries) {
    if (screen.kind !== "screen") continue;
    const baseEntry = bases.get(screen.id);
    const base = baseEntry?.kind === "screen" ? baseEntry : undefined;
    for (const viewport of VIEWPORTS) {
      for (const scheme of unionColorSchemes(base, screen)) {
        const before = base
          ? fragmentForView(base, viewport, scheme)
          : undefined;
        const after = fragmentForView(screen, viewport, scheme);
        if (!after) continue;
        pairs.push({
          ...(before ? { base: before } : {}),
          head: after,
          context: `${screen.route} (${viewport}, ${scheme})`,
          changed: before !== after || changed.has(after),
        });
      }
    }
  }
  return pairs;
}
