import type { ManifestPage, ManifestScreen } from "./types.js";

/** Baseline context retained independently of current collection membership. */
export interface RemovedEntrySnapshot {
  entry: ManifestPage | ManifestScreen;
  ancestors: readonly { id: string; title: string }[];
}

/** One pinned generation shared by Browse, watched updates and publication. */
export interface CatalogueChangeSnapshot {
  schemaVersion: 1;
  baseRef: string;
  baseCommit: string;
  changedRoutes: readonly string[];
  removedEntries: readonly RemovedEntrySnapshot[];
}
