/** Render one edited context through Build's adapter and validation contracts. */
import type { LoadedGraph } from "../../build/load_graph.js";
import type { ComponentRuntime } from "../../build/component_runtime.js";
import { validateHtmlLinks } from "../../build/html_links.js";
import { validateLogicalFragments } from "../../build/logical_records.js";
import {
  generatedHeader,
  validateGeneratedOwnershipHeaders,
} from "../../build/ownership.js";
import { stylesheetsFor } from "../../build/render.js";
import { transformCompatibilityDocuments } from "../../compatibility/transform.js";
import { encodeProps } from "../../components/codec.js";
import { validateComponentResources } from "../../components/output_validation.js";
import { validateComponentRanges } from "../../components/ranges.js";
import { validateRenderRequest } from "../../components/render_request.js";
import type { ComponentRenderRequest } from "../../components/render_types.js";
import { rebaseStyleOwnership } from "../../components/style_ownership.js";
import { generatedViews } from "../../components/views.js";
import { MANIFEST_NAME, parseManifest } from "../../registry/manifest.js";
import { prepareRegistry } from "../../registry/prepare.js";
import { normalizeSingleDocument } from "../../review/ignore.js";
import {
  captureRenderBundle,
  type TransientRender,
} from "./transient_assets.js";

export function renderTransient(
  runtime: ComponentRuntime,
  graph: LoadedGraph,
  request: ComponentRenderRequest,
): TransientRender {
  const { props } = validateRenderRequest(
    request,
    runtime.manifest,
    runtime.generation,
  );
  const { config } = runtime;
  const registry = prepareRegistry(graph.definitions, config);
  const components = registry.entries.filter(
    (entry) => entry.kind === "component",
  );
  const entry = components.find((entry) => entry.id === request.componentId)!;
  const saved = entry.variants.find(
    (variant) => variant.id === request.variantId,
  )!;
  const componentProps = {
    ...props,
    ...Object.fromEntries(
      entry.slots
        .filter((key) => Object.hasOwn(saved.props, key))
        .map((key) => [key, saved.props[key]]),
    ),
  };
  const manifest = structuredClone(runtime.manifest);
  const record = manifest.entries.find(
    (item) => item.kind === "component" && item.id === entry.id,
  );
  if (record?.kind !== "component") throw new Error("Missing component record");
  const variant = record.variants.find(
    (item) => item.id === request.variantId,
  )!;
  const route = generatedViews(record).find(
    (view) =>
      view.variantId === request.variantId &&
      view.viewport === request.viewport &&
      view.colorScheme === request.colorScheme,
  )!.path;
  const output = graph.renderWithComponents(
    {
      entry,
      variantId: request.variantId,
      viewport: request.viewport,
      colorScheme: request.colorScheme,
      node: null,
      componentProps,
      stylesheets: stylesheetsFor(
        entry.route,
        route,
        request.colorScheme,
        config,
      ),
    },
    graph.renderer,
    components,
  );
  const raw = generatedHeader(entry.sourceRelativePath) + output.html;
  const outputs = new Map([[route, raw.endsWith("\n") ? raw : `${raw}\n`]]);
  const retained = new Map(runtime.outputs);
  const records = transformCompatibilityDocuments(
    outputs,
    registry.entries,
    config,
    graph,
    new Map([[route, request]]),
    [...retained.keys()],
  );
  const html = outputs.get(route)!;
  const view = {
    ...output.view,
    styles: rebaseStyleOwnership(output.html, html, output.view.styles),
  };
  validateComponentRanges(html, view.ranges);
  validateGeneratedOwnershipHeaders(
    outputs,
    new Map([[route, entry.sourceRelativePath]]),
  );
  normalizeSingleDocument(html, route);
  variant.props = encodeProps(props);
  variant.componentViews = variant.componentViews.map((previous) =>
    previous.viewport === view.viewport &&
    previous.colorScheme === view.colorScheme
      ? view
      : previous,
  );
  parseManifest(manifest);
  validateComponentResources(new Map([[route, view]]), config);
  retained.set(route, html);
  retained.delete(MANIFEST_NAME);
  validateLogicalFragments(retained, records, registry.entries, config);
  validateHtmlLinks(retained, config);
  return {
    route,
    props: variant.props,
    view,
    files: captureRenderBundle(route, retained, manifest, config),
  };
}
