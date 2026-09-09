/** Optional changed-route detection powering the Browse changed/all filter. */

import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { minimatch } from "minimatch";

import { MokabookError } from "../errors.js";
import type {
  CatalogueChangeSnapshot,
  RemovedEntrySnapshot,
} from "../registry/changes.js";
import { projectRealPath, toPosixPath } from "../config/paths.js";
import type { ResolvedConfig } from "../config/types.js";
import { dependencyContainsChangedPath } from "../registry/dependency_paths.js";
import {
  analyzeHierarchy,
  type CatalogueHierarchy,
} from "../registry/hierarchy.js";
import { readManifest } from "../registry/manifest.js";
import type { ManifestEntry, HistoricalManifest } from "../registry/types.js";
import { readBaseManifest } from "../review/base_manifest.js";
import { reviewChangedPaths } from "../review/changed_paths.js";
import type { GitClient } from "../review/git.js";
import { NodeGitCommandRunner, RepositoryGitClient } from "../review/git.js";

/** Compute routes affected since the base branch point, if available. */
export async function computeChangedRoutes(
  config: ResolvedConfig,
  base: string,
  git?: GitClient,
): Promise<readonly string[] | undefined> {
  try {
    return (await computeCatalogueChanges(config, base, git)).changedRoutes;
  } catch {
    return undefined;
  }
}

/** Resolve one generation; explicit review callers retain failures instead of empty changes. */
export async function computeCatalogueChanges(
  config: ResolvedConfig,
  base: string,
  git?: GitClient,
): Promise<CatalogueChangeSnapshot> {
  let client = git;
  if (!client) {
    const runner = new NodeGitCommandRunner(config.repoRoot);
    const toplevel = (
      await runner.run(["rev-parse", "--show-toplevel"])
    ).trim();
    if (projectRealPath(toplevel) !== projectRealPath(config.repoRoot))
      throw new MokabookError(
        "git-failed",
        "catalogue is not the root of a Git repository",
      );
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
  const baseline = await readBaseManifest(client, commit, config);
  const removedEntries = removedManifestEntries(manifest, baseline);
  return {
    schemaVersion: 1,
    baseRef: base,
    baseCommit: commit,
    removedEntries,
    changedRoutes: [
      ...new Set([
        ...changedManifestRoutes(manifest, baseline, config, changed),
        ...removedEntries.map(({ entry }) => entry.route),
      ]),
    ].sort(),
  };
}

/** Only a free old route retains a baseline leaf; current ids and routes always win. */
export function removedManifestEntries(
  manifest: HistoricalManifest,
  baseline: HistoricalManifest,
): RemovedEntrySnapshot[] {
  const routes = new Set(
    manifest.entries.flatMap((entry) =>
      entry.kind === "collection" ? [] : [entry.route],
    ),
  );
  const hierarchy = analyzeHierarchy(baseline.entries).hierarchy;
  return baseline.entries
    .flatMap((entry): RemovedEntrySnapshot[] =>
      (entry.kind === "page" || entry.kind === "screen") &&
      !routes.has(entry.route)
        ? [
            {
              entry,
              ancestors: (hierarchy.ancestorsById.get(entry.id) ?? []).map(
                ({ id, title }) => ({ id, title }),
              ),
            },
          ]
        : [],
    )
    .sort(
      (a, b) =>
        a.entry.route.localeCompare(b.entry.route) ||
        a.entry.id.localeCompare(b.entry.id),
    );
}

/** Match manifest entries against repository-relative changed paths. */
export function changedManifestRoutes(
  manifest: HistoricalManifest,
  baseManifest: HistoricalManifest,
  config: ResolvedConfig,
  changedPaths: readonly string[],
): readonly string[] {
  const mockupsPrefix = toPosixPath(
    path.relative(config.repoRoot, config.mockupsDir),
  );
  const sharedImpact = changedPaths.some((changed) =>
    config.review.sharedImpact.some((glob) =>
      minimatch(changed, glob, { dot: true }),
    ),
  );
  const routes = new Set<string>();
  const changedScreenIds = new Set<string>();
  const baseEntries = new Map(
    baseManifest.entries.map((entry) => [entry.id, entry]),
  );
  const hierarchy = analyzeHierarchy(manifest.entries).hierarchy;
  const baseHierarchy = analyzeHierarchy(baseManifest.entries).hierarchy;
  for (const entry of manifest.entries) {
    if (entry.kind === "collection") continue;
    const baseEntry = baseEntries.get(entry.id);
    const candidates = changedPathCandidates(entry, baseEntry, mockupsPrefix);
    if (
      !sharedImpact &&
      isDeepStrictEqual(
        routeChangeProjection(entry, hierarchy),
        routeChangeProjection(baseEntry, baseHierarchy),
      ) &&
      !candidates.some((candidate) =>
        changedPaths.some((changedPath) =>
          dependencyContainsChangedPath(candidate, changedPath),
        ),
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
    dependencies: entry.dependencies,
    description: entry.description,
    id: entry.id,
    kind: entry.kind,
    rationale: entry.rationale,
    relatedDocs: entry.relatedDocs,
    sourcePath: entry.sourcePath,
    tags: entry.kind === "collection" ? undefined : entry.tags,
    title: entry.title,
  };
  if (entry.kind === "collection") {
    return { ...common, childIds: entry.childIds };
  }
  if (entry.kind === "page") return { ...common, route: entry.route };
  if (entry.kind === "use-case") {
    return { ...common, route: entry.route, steps: entry.steps };
  }
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
  const candidates = [
    ...declaredDependencies(entry),
    ...(baseEntry ? declaredDependencies(baseEntry) : []),
  ];
  for (const candidate of [entry, baseEntry]) {
    if (candidate?.kind === "page")
      candidates.push(`${mockupsPrefix}/${candidate.route}`);
    if (candidate?.kind !== "screen") continue;
    candidates.push(
      `${mockupsPrefix}/${candidate.fragments.mobile}`,
      `${mockupsPrefix}/${candidate.fragments.desktop}`,
    );
    if (candidate.darkFragments) {
      candidates.push(
        `${mockupsPrefix}/${candidate.darkFragments.mobile}`,
        `${mockupsPrefix}/${candidate.darkFragments.desktop}`,
      );
    }
  }
  return [...new Set(candidates)];
}

function declaredDependencies(entry: ManifestEntry): readonly string[] {
  return entry.dependencies.filter(
    (dependency) => dependency !== entry.sourcePath,
  );
}
