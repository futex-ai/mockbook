import fs from "node:fs";
import path from "node:path";

import type {
  ColorScheme,
  ResolvedRegistryEntry,
  Viewport,
} from "../authoring/types.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError, errorMessage } from "../errors.js";
import { analyzeHierarchy } from "./hierarchy.js";
import { validateManifest } from "./manifest_validation.js";
import type { ManifestEntry, ManifestV4, HistoricalManifest } from "./types.js";
import { effectiveColorSchemes } from "./views.js";

/** Canonical generated manifest filename. */
export const MANIFEST_NAME = "mokabook-manifest.json";

/** Legacy version 2 manifest filename accepted only during migration. */
export const LEGACY_MANIFEST_NAME = "mockbook-manifest.json";

/** Derive one viewport and color-scheme fragment route from a screen route. */
export function fragmentRoute(
  route: string,
  viewport: Viewport,
  colorScheme: ColorScheme = "light",
): string {
  const schemeSuffix = colorScheme === "dark" ? ".dark" : "";
  return route.replace(/\.html$/, `.${viewport}${schemeSuffix}.html`);
}

/** Create deterministic manifest data from prepared entries and the source inventory. */
export function createManifest(
  entries: readonly ResolvedRegistryEntry[],
  sourceFiles: readonly string[],
  catalogueSchemes: readonly ColorScheme[],
): ManifestV4 {
  const hierarchy = analyzeHierarchy(entries).hierarchy;
  return {
    entries: entries.map((entry) =>
      toManifestEntry(
        entry,
        catalogueSchemes,
        hierarchy.ancestorsById
          .get(entry.id)
          ?.map((ancestor) => ancestor.title) ?? [],
      ),
    ),
    generatedBy: "mokabook",
    sourceFiles: [
      ...new Set([
        ...sourceFiles,
        ...entries.map((entry) => entry.sourceRelativePath),
      ]),
    ].sort(),
    schemaVersion: 4,
  };
}

/** Serialize a version 4 manifest byte-stably. */
export function serializeManifest(manifest: ManifestV4): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** Read strictly current schema-v4 canonical output. */
export function readManifest(config: ResolvedConfig): ManifestV4 {
  const canonicalPath = path.join(config.mockupsDir, MANIFEST_NAME);
  const manifest = readManifestFile(canonicalPath);
  config.sourceFiles = manifest.sourceFiles;
  return manifest;
}

/** Select the strict canonical input or the explicitly enabled legacy input. */
export function selectManifestInput(
  canonicalExists: boolean,
  allowLegacyV2: boolean,
): { allowV2: boolean; filename: string } {
  if (canonicalExists || !allowLegacyV2) {
    return { allowV2: false, filename: MANIFEST_NAME };
  }
  return { allowV2: true, filename: LEGACY_MANIFEST_NAME };
}

function readManifestFile(candidate: string): ManifestV4 {
  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(candidate, "utf8"));
  } catch (error) {
    throw new MokabookError(
      "manifest-invalid",
      `could not read ${candidate}: ${errorMessage(error)}`,
      {
        cause: error,
      },
    );
  }
  return parseManifest(value);
}

/** Validate manifest-shaped JSON and normalize temporary version 2 input. */
export function parseManifest(value: unknown): ManifestV4 {
  return validateManifest(value, false, false) as ManifestV4;
}

/** Read old schemas only at the historical comparison boundary. */
export function parseHistoricalManifest(
  value: unknown,
  allowV2 = false,
): HistoricalManifest {
  return validateManifest(value, allowV2, true);
}

function toManifestEntry(
  entry: ResolvedRegistryEntry,
  catalogueSchemes: readonly ColorScheme[],
  navPath: readonly string[],
): ManifestEntry {
  const common = {
    dependencies: [
      ...new Set([entry.sourceRelativePath, ...entry.dependencies]),
    ].sort(),
    description: entry.description,
    id: entry.id,
    kind: entry.kind,
    navPath: [...navPath],
    ...(entry.rationale ? { rationale: entry.rationale } : {}),
    relatedDocs: [...entry.relatedDocs],
    sourcePath: entry.sourceRelativePath,
    title: entry.title,
  };
  if (entry.kind === "collection")
    return { ...common, childIds: [...entry.childIds], kind: "collection" };
  if (entry.kind === "page")
    return {
      ...common,
      kind: "page",
      route: entry.route,
      ...(entry.tags?.length ? { tags: [...entry.tags] } : {}),
    };
  if (entry.kind === "use-case") {
    return {
      ...common,
      kind: "use-case",
      route: entry.route,
      steps: entry.steps.map((step) => ({ ...step })),
      ...(entry.tags && entry.tags.length > 0 ? { tags: [...entry.tags] } : {}),
    };
  }
  return {
    ...common,
    ...(entry.address ? { address: entry.address } : {}),
    ...(effectiveColorSchemes(entry, catalogueSchemes).includes("dark")
      ? {
          darkFragments: {
            desktop: fragmentRoute(entry.route, "desktop", "dark"),
            mobile: fragmentRoute(entry.route, "mobile", "dark"),
          },
        }
      : {}),
    fragments: {
      desktop: fragmentRoute(entry.route, "desktop"),
      mobile: fragmentRoute(entry.route, "mobile"),
    },
    kind: "screen",
    route: entry.route,
    ...(entry.tags && entry.tags.length > 0 ? { tags: [...entry.tags] } : {}),
    useCaseIds: [...entry.useCaseIds],
    viewports: ["mobile", "desktop"],
  };
}
