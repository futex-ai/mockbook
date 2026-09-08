import type {
  ManifestEntry,
  ManifestLegacyPage,
  ManifestV3,
} from "../registry/types.js";
import {
  analyzeHierarchy,
  type CatalogueHierarchy,
} from "../registry/hierarchy.js";

/** Validated lookup model used by server routes. */
export interface Catalogue {
  byId: ReadonlyMap<string, ManifestEntry>;
  byRoute: ReadonlyMap<string, ManifestEntry | ManifestLegacyPage>;
  /** Whether any screen in the catalogue was rendered in the dark scheme. */
  hasDarkFragments: boolean;
  hierarchy: CatalogueHierarchy<ManifestEntry>;
  manifest: ManifestV3;
  /** Every classification tag the entries declare, deduplicated and sorted. */
  tags: readonly string[];
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
export function createCatalogue(manifest: ManifestV3): Catalogue {
  const byId = new Map(manifest.entries.map((entry) => [entry.id, entry]));
  const byRoute = new Map<string, ManifestEntry | ManifestLegacyPage>();
  for (const entry of manifest.entries) {
    if (entry.kind !== "collection") byRoute.set(entry.route, entry);
  }
  for (const page of manifest.legacyPages) byRoute.set(page.route, page);
  const hasDarkFragments = manifest.entries.some(
    (entry) => entry.kind === "screen" && entry.darkFragments !== undefined,
  );
  const hierarchy = analyzeHierarchy(manifest.entries).hierarchy;
  const tags = collectTags(manifest.entries);
  return { byId, byRoute, hasDarkFragments, hierarchy, manifest, tags };
}
