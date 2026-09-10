/** Request-visible logical-fragment validation for served Browse routes. */

import fs from "node:fs";
import path from "node:path";

import type { ResolvedConfig } from "../config/types.js";
import { extractHtmlReferences } from "../html_references.js";
import { isLogicalFragment } from "../navigation/logical.js";
import type { ManifestComponent } from "../components/manifest_types.js";
import { generatedViews } from "../components/views.js";
import type { ManifestEntry, ManifestScreen } from "../registry/types.js";
import type { Catalogue } from "./catalogue.js";

/** Parse and cross-view validate the optional fragment query. */
export function requestedFragment(
  url: URL,
  entry: ManifestEntry | undefined,
  catalogue: Catalogue,
  config: ResolvedConfig,
): string | null | undefined {
  const values = url.searchParams.getAll("fragment");
  if (values.length === 0) return undefined;
  const fragment = values.length === 1 ? values[0] : undefined;
  if (!fragment || !isLogicalFragment(fragment)) return null;
  const screen = destinationScreen(entry, catalogue);
  if (!screen || !allViewsContain(screen, fragment, config)) return null;
  return fragment;
}

/** Add the one canonical encoded fragment query to a route. */
export function withFragmentQuery(route: string, fragment?: string): string {
  return fragment === undefined
    ? route
    : `${route}?fragment=${encodeURIComponent(fragment)}`;
}

function destinationScreen(
  entry: ManifestEntry | undefined,
  catalogue: Catalogue,
): ManifestScreen | ManifestComponent | undefined {
  if (entry?.kind === "screen" || entry?.kind === "component") return entry;
  if (entry?.kind !== "use-case" || !entry.steps[0]) return undefined;
  const candidate = catalogue.byId.get(entry.steps[0].screenId);
  return candidate?.kind === "screen" ? candidate : undefined;
}

function allViewsContain(
  screen: ManifestScreen | ManifestComponent,
  fragment: string,
  config: ResolvedConfig,
): boolean {
  const routes = generatedViews(screen)
    .filter(
      (view) =>
        screen.kind !== "component" ||
        view.variantId === screen.variants[0]!.id,
    )
    .map((view) => view.path);
  return routes.every((route) => {
    try {
      const content = fs.readFileSync(
        path.join(config.mockupsDir, route),
        "utf8",
      );
      return extractHtmlReferences(content).anchors.has(fragment);
    } catch {
      return false;
    }
  });
}
