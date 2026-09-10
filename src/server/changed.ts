/** Optional changed-route detection powering the Browse changed/all filter. */

import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { projectRealPath, toPosixPath } from "../config/paths.js";
import type { ResolvedConfig } from "../config/types.js";
import {
  analyzeHierarchy,
  type CatalogueHierarchy,
} from "../registry/hierarchy.js";
import { readManifest } from "../registry/manifest.js";
import type { ManifestEntry, Manifest } from "../registry/types.js";
import { readBaseManifest } from "../review/base_manifest.js";
import { reviewChangedPaths } from "../review/changed_paths.js";
import type { GitClient } from "../review/git.js";
import { NodeGitCommandRunner, RepositoryGitClient } from "../review/git.js";
import { classifyComponents } from "../review/component_classification.js";
import {
  FileSystemReviewAssetReader,
  GitReviewAssetReader,
} from "../review/assets.js";
import { changedContentPaths } from "./changed_content.js";

/** Compute routes affected since the base branch point, if available. */
export async function computeChangedRoutes(
  config: ResolvedConfig,
  base: string,
  git?: GitClient,
): Promise<readonly string[] | undefined> {
  try {
    let client = git;
    if (!client) {
      const runner = new NodeGitCommandRunner(config.repoRoot);
      const toplevel = (
        await runner.run(["rev-parse", "--show-toplevel"])
      ).trim();
      if (projectRealPath(toplevel) !== projectRealPath(config.repoRoot))
        return undefined;
      client = new RepositoryGitClient(runner);
    }
    const commit = await client.mergeBase(base, "HEAD");
    const changed = await reviewChangedPaths(
      client,
      commit,
      config,
      config.review.outDir,
    );
    const manifest = readManifest(config);
    const baseManifest = await readBaseManifest(client, commit, config);
    if (manifest.schemaVersion === 4 || baseManifest.schemaVersion === 4) {
      const prefix = toPosixPath(
        path.relative(config.repoRoot, config.mockupsDir),
      );
      const result = await classifyComponents({
        before: baseManifest,
        after: manifest,
        config,
        baseCommit: commit,
        baseRef: base,
        changedPaths: changed,
        beforeReader: new GitReviewAssetReader(config, client, commit, prefix),
        afterReader: new FileSystemReviewAssetReader(config),
      });
      return result.changes
        .map((entry) => (entry.after ?? entry.before)!.route)
        .sort();
    }
    const contentChanges = await changedContentPaths(
      manifest,
      baseManifest,
      config,
      client,
      commit,
      changed,
    );
    return changedManifestRoutes(
      manifest,
      baseManifest,
      config,
      contentChanges,
    );
  } catch {
    return undefined;
  }
}

/** Match reviewable metadata and repository-relative material fragment paths. */
export function changedManifestRoutes(
  manifest: Manifest,
  baseManifest: Manifest,
  config: ResolvedConfig,
  changedPaths: readonly string[],
): readonly string[] {
  const mockupsPrefix = toPosixPath(
    path.relative(config.repoRoot, config.mockupsDir),
  );
  const routes = new Set<string>();
  const changedScreenIds = new Set<string>();
  const baseEntries = new Map(
    baseManifest.entries.map((entry) => [entry.id, entry]),
  );
  const hierarchy = analyzeHierarchy<ManifestEntry>(manifest.entries).hierarchy;
  const baseHierarchy = analyzeHierarchy<ManifestEntry>(
    baseManifest.entries,
  ).hierarchy;
  for (const entry of manifest.entries) {
    if (entry.kind === "collection") continue;
    const baseEntry = baseEntries.get(entry.id);
    const candidates = changedPathCandidates(entry, baseEntry, mockupsPrefix);
    if (
      isDeepStrictEqual(
        routeChangeProjection(entry, hierarchy),
        routeChangeProjection(baseEntry, baseHierarchy),
      ) &&
      !candidates.some((candidate) =>
        changedPaths.some((changedPath) => candidate === changedPath),
      )
    ) {
      continue;
    }
    routes.add(entry.route);
    if (entry.kind === "screen") changedScreenIds.add(entry.id);
  }
  for (const entry of manifest.entries) {
    if (
      entry.kind === "use-case" &&
      entry.steps.some((step) => changedScreenIds.has(step.screenId))
    ) {
      routes.add(entry.route);
    }
  }
  return [...routes].sort();
}

/** Select manifest metadata whose changes can affect a routed Browse entry. */
function routeChangeProjection(
  entry: ManifestEntry | undefined,
  hierarchy: CatalogueHierarchy<ManifestEntry>,
): unknown {
  if (!entry) return undefined;
  const common = {
    ancestorCollections: (hierarchy.ancestorsById.get(entry.id) ?? []).map(
      ({ id, title }) => ({ id, title }),
    ),
    description: entry.description,
    id: entry.id,
    kind: entry.kind,
    rationale: entry.rationale,
    relatedDocs: entry.relatedDocs,
    tags: entry.kind === "collection" ? undefined : entry.tags,
    title: entry.title,
  };
  if (entry.kind === "collection") {
    return { ...common, childIds: entry.childIds };
  }
  if (entry.kind === "use-case") {
    return { ...common, route: entry.route, steps: entry.steps };
  }
  if (entry.kind === "component")
    return {
      ...common,
      route: entry.route,
      propSchema: entry.propSchema,
      controls: entry.controls,
      slots: entry.slots,
      variants: entry.variants.map(
        ({ componentViews: _views, ...variant }) => variant,
      ),
    };
  return {
    ...common,
    address: entry.address,
    darkFragments: entry.darkFragments,
    fragments: entry.fragments,
    route: entry.route,
    useCaseIds: entry.useCaseIds,
    viewports: entry.viewports,
  };
}

function changedPathCandidates(
  entry: ManifestEntry,
  baseEntry: ManifestEntry | undefined,
  mockupsPrefix: string,
): string[] {
  const candidates: string[] = [];
  const prefix = mockupsPrefix ? `${mockupsPrefix}/` : "";
  for (const candidate of [entry, baseEntry]) {
    if (candidate?.kind !== "screen") continue;
    candidates.push(
      `${prefix}${candidate.fragments.mobile}`,
      `${prefix}${candidate.fragments.desktop}`,
    );
    if (candidate.darkFragments) {
      candidates.push(
        `${prefix}${candidate.darkFragments.mobile}`,
        `${prefix}${candidate.darkFragments.desktop}`,
      );
    }
  }
  return [...new Set(candidates)];
}
