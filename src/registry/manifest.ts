import fs from "node:fs";
import path from "node:path";

import type {
  ColorScheme,
  ResolvedRegistryEntry,
  Viewport,
} from "../authoring/types.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError, errorMessage } from "../errors.js";
import { canonicalJson } from "../components/data.js";
import { componentManifestEntry } from "../components/manifest_build.js";
import type { ComponentViewRecord } from "../components/manifest_types.js";
import { analyzeHierarchy } from "./hierarchy.js";
import { validateManifest } from "./manifest_validation.js";
import type { ManifestEntry, ManifestLegacyPage, Manifest } from "./types.js";
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

/** Create deterministic manifest data from prepared entries and legacy pages. */
export function createManifest(
  entries: readonly ResolvedRegistryEntry[],
  legacyPages: readonly ManifestLegacyPage[],
  catalogueSchemes: readonly ColorScheme[],
  componentViews: ReadonlyMap<string, ComponentViewRecord> = new Map(),
): Manifest {
  const hierarchy = analyzeHierarchy(entries).hierarchy;
  return {
    entries: entries.map((entry) =>
      toManifestEntry(
        entry,
        catalogueSchemes,
        componentViews,
        hierarchy.ancestorsById
          .get(entry.id)
          ?.map((ancestor) => ancestor.title) ?? [],
      ),
    ),
    generatedBy: "mokabook",
    legacyPages: [...legacyPages].sort((left, right) =>
      entries.some((entry) => entry.kind === "component")
        ? left.route < right.route
          ? -1
          : left.route > right.route
            ? 1
            : 0
        : left.route.localeCompare(right.route),
    ),
    schemaVersion: entries.some((entry) => entry.kind === "component") ? 4 : 3,
  } as Manifest;
}

/** Serialize a version 3 manifest byte-stably. */
export function serializeManifest(manifest: Manifest): string {
  return `${manifest.schemaVersion === 4 ? canonicalJson(manifest, 2) : JSON.stringify(manifest, null, 2)}\n`;
}

/** Read canonical output, falling back to the legacy v2 file only when absent. */
export function readManifest(config: ResolvedConfig): Manifest {
  const canonicalPath = path.join(config.mockupsDir, MANIFEST_NAME);
  const selection = selectManifestInput(
    fs.existsSync(canonicalPath),
    config.compatibility.readManifestV2,
  );
  return readManifestFile(
    path.join(config.mockupsDir, selection.filename),
    selection.allowV2,
  );
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

function readManifestFile(candidate: string, allowV2: boolean): Manifest {
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
  return parseManifest(value, allowV2);
}

/** Validate manifest-shaped JSON and normalize temporary version 2 input. */
export function parseManifest(value: unknown, allowV2 = false): Manifest {
  return validateManifest(value, allowV2);
}

function toManifestEntry(
  entry: ResolvedRegistryEntry,
  catalogueSchemes: readonly ColorScheme[],
  componentViews: ReadonlyMap<string, ComponentViewRecord>,
  navPath: readonly string[],
): ManifestEntry {
  const common = {
    ...(componentViews.size
      ? { declaredDependencies: [...new Set(entry.dependencies)].sort() }
      : {}),
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
  if (entry.kind === "component")
    return componentManifestEntry(
      entry,
      common,
      catalogueSchemes,
      componentViews,
    );
  if (entry.kind === "collection")
    return { ...common, childIds: [...entry.childIds], kind: "collection" };
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
    ...(componentViews.size
      ? {
          componentViews: ["mobile", "desktop"].flatMap((viewport) =>
            effectiveColorSchemes(entry, catalogueSchemes).map((scheme) =>
              componentViews.get(
                fragmentRoute(entry.route, viewport as Viewport, scheme),
              )!,
            ),
          ),
        }
      : {}),
    route: entry.route,
    ...(entry.tags && entry.tags.length > 0 ? { tags: [...entry.tags] } : {}),
    useCaseIds: [...entry.useCaseIds],
    viewports: ["mobile", "desktop"],
  };
}
