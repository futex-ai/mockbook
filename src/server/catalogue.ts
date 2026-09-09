import type { RemovedEntrySnapshot } from "../registry/changes.js";
import type {
  ManifestEntry,
  ManifestScreen,
  ManifestV4,
} from "../registry/types.js";
import {
  analyzeHierarchy,
  type CatalogueHierarchy,
} from "../registry/hierarchy.js";

/** Validated lookup model used by server routes. */
export interface Catalogue {
  byId: ReadonlyMap<string, ManifestEntry>;
  byRoute: ReadonlyMap<string, ManifestEntry>;
  /** Whether any screen in the catalogue was rendered in the dark scheme. */
  hasDarkFragments: boolean;
  hierarchy: CatalogueHierarchy<ManifestEntry>;
  manifest: ManifestV4;
  /** Every classification tag the entries declare, deduplicated and sorted. */
  tags: readonly string[];
  /** Baseline screens retained only for on-demand comparisons. */
  removedScreens: readonly ManifestScreen[];
  removedEntries: readonly RemovedEntrySnapshot[];
}

/** The union of the tags declared across every entry that can carry them. */
function collectTags(entries: readonly ManifestEntry[]): readonly string[] {
  const declared: string[] = [];
  for (const entry of entries) {
    if (entry.kind !== "collection") declared.push(...(entry.tags ?? []));
  }
  return [...new Set(declared)].sort();
}

/** Build deterministic id and route indexes from a validated manifest. */
export function createCatalogue(
  manifest: ManifestV4,
  removedEntries: readonly RemovedEntrySnapshot[] = [],
): Catalogue {
  const removedScreens = removedEntries.flatMap(({ entry }) =>
    entry.kind === "screen" ? [entry] : [],
  );
  const byId = new Map(manifest.entries.map((entry) => [entry.id, entry]));
  const byRoute = new Map<string, ManifestEntry>();
  for (const entry of manifest.entries) {
    if (entry.kind !== "collection") byRoute.set(entry.route, entry);
  }
  for (const { entry } of removedEntries)
    if (!byId.has(entry.id)) byId.set(entry.id, entry);
  const hasDarkFragments = [...manifest.entries, ...removedScreens].some(
    (entry) => entry.kind === "screen" && entry.darkFragments !== undefined,
  );
  const hierarchy = analyzeHierarchy(manifest.entries).hierarchy;
  const tags = collectTags(manifest.entries);
  return {
    byId,
    byRoute,
    hasDarkFragments,
    hierarchy,
    manifest,
    tags,
    removedScreens,
    removedEntries,
  };
}
