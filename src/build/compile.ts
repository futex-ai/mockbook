import type { ResolvedConfig } from "../config/types.js";
import { transformCompatibilityDocuments } from "../compatibility/transform.js";
import { MokabookError } from "../errors.js";
import { renderLegacyPages } from "../legacy/pages.js";
import {
  createManifest,
  fragmentRoute,
  MANIFEST_NAME,
  parseManifest,
  serializeManifest,
} from "../registry/manifest.js";
import { prepareRegistry } from "../registry/prepare.js";
import type { ManifestLegacyPage, Manifest } from "../registry/types.js";
import type { ArtifactView } from "../registry/views.js";
import { effectiveColorSchemes, VIEWPORTS } from "../registry/views.js";
import { normalizeSingleDocument } from "../review/ignore.js";
import { validateHtmlLinks } from "./html_links.js";
import { validateLogicalFragments } from "./logical_records.js";
import { rememberRuntime } from "./component_runtime.js";
import { loadConsumerGraph } from "./load_graph.js";
import {
  generatedHeader,
  validateGeneratedOwnershipHeaders,
} from "./ownership.js";
import { validateGeneratedOutputPaths } from "./output_paths.js";
import type { ComponentViewRecord } from "../components/manifest_types.js";
import { componentFragmentRoute } from "../components/paths.js";
import { rebaseStyleOwnership } from "../components/style_ownership.js";
import { validateComponentResources } from "../components/output_validation.js";
import { validateComponentRanges } from "../components/ranges.js";
import { addOutput, renderFragments } from "./render.js";

/** Complete in-memory static compilation result. */
export interface Compilation {
  manifest: Manifest;
  outputs: ReadonlyMap<string, string>;
}

/** Compile all expected bytes without mutating consumer output. */
export async function compileCatalogue(
  config: ResolvedConfig,
): Promise<Compilation> {
  const graph = await loadConsumerGraph(config);
  const registry = prepareRegistry(graph.definitions, config);
  const fragmentViews = new Map<string, ArtifactView>();
  const componentViews = new Map<string, ComponentViewRecord>();
  const outputs = renderFragments(
    registry.entries,
    graph.renderer,
    config,
    fragmentViews,
    graph.renderWithComponents,
    componentViews,
  );
  const legacy = renderLegacyPages(config, graph);
  const routedEntries = new Set(
    registry.entries.flatMap((entry) =>
      entry.kind === "collection" ? [] : [entry.route],
    ),
  );
  const generatedOwners = new Map<string, string>();
  for (const entry of registry.entries) {
    if (entry.kind !== "screen" && entry.kind !== "component") continue;
    for (const variantId of entry.kind === "component"
      ? entry.variants.map((variant) => variant.id)
      : [undefined]) {
      for (const viewport of VIEWPORTS) {
        for (const colorScheme of effectiveColorSchemes(
          entry,
          config.colorSchemes,
        )) {
          generatedOwners.set(
            variantId
              ? componentFragmentRoute(
                  entry.route,
                  variantId,
                  viewport,
                  colorScheme,
                )
              : fragmentRoute(entry.route, viewport, colorScheme),
            entry.sourceRelativePath,
          );
        }
      }
    }
  }
  const fragmentRoutes = new Set(generatedOwners.keys());
  for (const page of legacy) {
    if (routedEntries.has(page.route) || fragmentRoutes.has(page.route)) {
      throw new MokabookError(
        "build-invalid",
        `legacy route collides with registry output: ${page.route}`,
      );
    }
    addOutput(
      outputs,
      page.route,
      `${generatedHeader(page.sourceRelativePath)}${page.content}`,
    );
    generatedOwners.set(page.route, page.sourceRelativePath);
  }
  for (const route of routedEntries) {
    if (fragmentRoutes.has(route)) {
      throw new MokabookError(
        "build-invalid",
        `fragment route collides with registry route: ${route}`,
      );
    }
  }
  const beforeTransform = new Map(outputs);
  const logicalRecords = transformCompatibilityDocuments(
    outputs,
    registry.entries,
    config,
    graph,
    fragmentViews,
  );
  for (const [route, view] of componentViews) {
    const final = outputs.get(route)!;
    validateComponentRanges(final, view.ranges);
    componentViews.set(route, {
      ...view,
      styles: rebaseStyleOwnership(
        beforeTransform.get(route)!,
        final,
        view.styles,
      ),
    });
  }
  validateGeneratedOwnershipHeaders(outputs, generatedOwners);
  validateLogicalFragments(outputs, logicalRecords, registry.entries, config);
  for (const [route, content] of outputs) {
    normalizeSingleDocument(content, route);
  }
  const legacyManifest: ManifestLegacyPage[] = legacy.map((page) => ({
    route: page.route,
    sourcePath: page.sourceRelativePath,
  }));
  const manifest = createManifest(
    registry.entries,
    legacyManifest,
    config.colorSchemes,
    componentViews,
  );
  parseManifest(manifest);
  validateComponentResources(componentViews, config);
  outputs.set(MANIFEST_NAME, serializeManifest(manifest));
  validateHtmlLinks(outputs, config);
  validateGeneratedOutputPaths(outputs.keys(), config);
  const compilation = { manifest, outputs };
  rememberRuntime(compilation, graph, config);
  return compilation;
}
