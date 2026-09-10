import type { ManifestComponent } from "../components/manifest_types.js";

import type {
  ManifestEntry,
  ManifestLegacyPage,
  ManifestScreen,
  Manifest,
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
  manifest: Manifest;
  /** Every classification tag the entries declare, deduplicated and sorted. */
  tags: readonly string[];
  /** Baseline screens retained only for on-demand comparisons. */
  removedScreens: readonly ManifestScreen[];
  /** Baseline component pages retained for immutable saved-variant comparisons. */
  removedComponents: readonly ManifestComponent[];
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
  manifest: Manifest,
  removedScreens: readonly ManifestScreen[] = [],
  removedComponents: readonly ManifestComponent[] = [],
): Catalogue {
  const byId = new Map(manifest.entries.map((entry) => [entry.id, entry]));
  const byRoute = new Map<string, ManifestEntry | ManifestLegacyPage>();
  for (const entry of manifest.entries) {
    if (entry.kind !== "collection") byRoute.set(entry.route, entry);
  }
  for (const page of manifest.legacyPages) byRoute.set(page.route, page);
  const hasDarkFragments = [
    ...manifest.entries,
    ...removedScreens,
    ...removedComponents,
  ].some((entry) =>
    entry.kind === "screen"
      ? entry.darkFragments !== undefined
      : entry.kind === "component" &&
        entry.variants.some((variant) => variant.darkFragments !== undefined),
  );
  const hierarchy = analyzeHierarchy<ManifestEntry>(manifest.entries).hierarchy;
  const tags = collectTags(manifest.entries);
  return {
    byId,
    byRoute,
    hasDarkFragments,
    hierarchy,
    manifest,
    tags,
    removedScreens,
    removedComponents,
  };
}

/** Keep baseline consumers addressable without inserting them into current ownership. */
export function catalogueAtBaseline(
  manifest: Manifest,
  baseline: Manifest,
): Catalogue {
  const routes = new Set(
    manifest.entries.flatMap((entry) =>
      entry.kind === "collection" ? [] : [entry.route],
    ),
  );
  const ids = new Set(manifest.entries.map((entry) => entry.id));
  return createCatalogue(
    manifest,
    baseline.entries.filter(
      (entry): entry is ManifestScreen =>
        entry.kind === "screen" && !routes.has(entry.route),
    ),
    baseline.entries.filter(
      (entry): entry is ManifestComponent =>
        entry.kind === "component" &&
        !ids.has(entry.id) &&
        !routes.has(entry.route),
    ),
  );
}
