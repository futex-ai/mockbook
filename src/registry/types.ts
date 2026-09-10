import type {
  ManifestComponent,
  ComponentViewRecord,
} from "../components/manifest_types.js";

import type { ResolvedRegistryEntry, Viewport } from "../authoring/types.js";

/** One actionable catalogue validation failure. */
export interface RegistryViolation {
  code: string;
  id?: string;
  message: string;
  sourceRelativePath: string;
}

/** A prepared and cross-reference-validated registry. */
export interface PreparedRegistry {
  entries: readonly ResolvedRegistryEntry[];
  byId: ReadonlyMap<string, ResolvedRegistryEntry>;
}

/** Serializable common metadata for a manifest entry. */
export interface ManifestEntryBase {
  dependencies: readonly string[];
  /** Explicit author declarations, required in v4; source attribution stays separate. */
  declaredDependencies?: readonly string[];
  description: string;
  id: string;
  kind: "collection" | "screen" | "use-case";
  navPath: readonly string[];
  rationale?: string;
  relatedDocs: readonly string[];
  sourcePath: string;
  title: string;
}

/** Serializable screen manifest entry. */
export interface ManifestScreen extends ManifestEntryBase {
  address?: string;
  componentViews?: readonly ComponentViewRecord[];
  darkFragments?: Record<Viewport, string>;
  fragments: Record<Viewport, string>;
  kind: "screen";
  route: string;
  /** Declared classification tags, present only when the entry has them. */
  tags?: readonly string[];
  useCaseIds: readonly string[];
  viewports: readonly Viewport[];
}

/** Serializable collection manifest entry. */
export interface ManifestCollection extends ManifestEntryBase {
  childIds: readonly string[];
  kind: "collection";
}

/** Serializable use-case manifest entry. */
export interface ManifestUseCase extends ManifestEntryBase {
  kind: "use-case";
  route: string;
  steps: readonly { description?: string; screenId: string; title?: string }[];
  /** Declared classification tags, present only when the entry has them. */
  tags?: readonly string[];
}

/** Any version 3 entry. */
export type ManifestEntry =
  ManifestScreen | ManifestCollection | ManifestUseCase | ManifestComponent;

/** One generated legacy page. */
export interface ManifestLegacyPage {
  route: string;
  sourcePath: string;
}

/** Canonical generated catalogue schema. */
export interface ManifestV3 {
  entries: readonly Exclude<ManifestEntry, ManifestComponent>[];
  generatedBy: "mokabook";
  legacyPages: readonly ManifestLegacyPage[];
  schemaVersion: 3;
}

/** Component-aware manifests require complete usage on every screen view. */
export interface ManifestScreenV4 extends ManifestScreen {
  declaredDependencies: readonly string[];
  componentViews: readonly ComponentViewRecord[];
}
export interface ManifestV4 {
  entries: readonly ManifestEntryV4[];
  generatedBy: "mokabook";
  legacyPages: readonly ManifestLegacyPage[];
  schemaVersion: 4;
}
export type Manifest = ManifestV3 | ManifestV4;

export type ManifestEntryV4 = (
  ManifestScreenV4 | ManifestComponent | ManifestCollection | ManifestUseCase
) & { declaredDependencies: readonly string[] };
