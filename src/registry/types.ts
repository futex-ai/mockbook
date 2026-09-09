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
  description: string;
  id: string;
  kind: "collection" | "screen" | "page" | "use-case";
  navPath: readonly string[];
  rationale?: string;
  relatedDocs: readonly string[];
  sourcePath: string;
  title: string;
}

/** Serializable screen manifest entry. */
export interface ManifestScreen extends ManifestEntryBase {
  address?: string;
  darkFragments?: Record<Viewport, string>;
  fragments: Record<Viewport, string>;
  kind: "screen";
  route: string;
  /** Declared classification tags, present only when the entry has them. */
  tags?: readonly string[];
  useCaseIds: readonly string[];
  viewports: readonly Viewport[];
}

/** Serializable whole-document page. */
export interface ManifestPage extends ManifestEntryBase {
  kind: "page";
  route: string;
  tags?: readonly string[];
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

/** Any supported registry entry, including current whole-document pages. */
export type ManifestEntry =
  ManifestScreen | ManifestPage | ManifestCollection | ManifestUseCase;

/** One generated legacy page. */
export interface ManifestLegacyPage {
  route: string;
  sourcePath: string;
}

/** Canonical generated catalogue schema. */
export interface ManifestV3 {
  entries: readonly ManifestEntry[];
  generatedBy: "mokabook";
  legacyPages: readonly ManifestLegacyPage[];
  schemaVersion: 3;
}

/** Current generated catalogue, with a complete private source inventory. */
export interface ManifestV4 {
  entries: readonly ManifestEntry[];
  generatedBy: "mokabook";
  schemaVersion: 4;
  sourceFiles: readonly string[];
}

/** Validated historical manifest used exclusively by Git comparisons. */
export type HistoricalManifest = ManifestV3 | ManifestV4;
