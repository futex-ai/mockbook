import crypto from "node:crypto";

import type { Compilation } from "../build/compile.js";
import { adaptBrowseDocument } from "../browse/document_adapter.js";
import {
  catalogueViewHref,
  parseStaticDelivery,
  type StaticDelivery,
} from "../navigation/delivery.js";
import type { ManifestScreen, ManifestV3 } from "../registry/types.js";
import type { ReviewArtifact, ReviewArtifactContent } from "../review/types.js";
import { createCatalogue } from "../server/catalogue.js";
import {
  loadBrowserClientModules,
  loadBrowserNavigationModules,
  loadShellFontAssets,
} from "../server/client_modules.js";
import { homePage, notFoundPage, viewPage } from "../server/pages.js";
import { changedManifestRoutes } from "../server/changed.js";
import { SHELL_CSS } from "../server/shell/css.js";
import type { ShellContext } from "../server/shell/context.js";
import type { ResolvedConfig } from "../config/types.js";
import { exportError } from "./error.js";
import { ExportInventory } from "./inventory.js";
import { isExportPublicName } from "./public_files.js";

/** Assemble one complete shell/resource/comparison tree without a live server. */
export function assembleExport(
  config: ResolvedConfig,
  compilation: Compilation,
  baseline: ManifestV3,
  comparison: ReviewArtifact,
  publicFiles: ReadonlyMap<string, Buffer>,
): { inventory: ExportInventory; delivery: StaticDelivery } {
  const current = createCatalogue(compilation.manifest);
  const removed = baseline.entries.filter(
    (entry): entry is ManifestScreen =>
      entry.kind === "screen" && !current.byRoute.has(entry.route),
  );
  const catalogue = createCatalogue(compilation.manifest, removed);
  const entries = [...current.byRoute.values(), ...removed];
  const idRoutes: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  for (const entry of [...compilation.manifest.entries, ...removed]) {
    if (entry.kind === "collection") continue;
    if (
      entry.kind === "screen" &&
      removed.includes(entry) &&
      current.byId.has(entry.id)
    )
      continue;
    idRoutes[entry.id] = catalogueViewHref(entry.route);
  }
  const comparisonFiles = new Map(comparison.files);
  comparisonFiles.set(
    "review.json",
    `${JSON.stringify(comparison.result, null, 2)}\n`,
  );
  const generation = contentId(comparisonFiles);
  const prefix = `__mokabook/diffs/__generations/${generation}`;
  const delivery = parseStaticDelivery({
    schemaVersion: 1,
    canonicalPath: "/",
    comparisonUrl: `/${prefix}/review.json`,
    idRoutes,
  });
  if (!delivery)
    throw exportError("Invalid static catalogue delivery metadata.");
  const inventory = new ExportInventory();
  for (const [name, bytes] of comparisonFiles) {
    if (
      name.startsWith("snapshots/") &&
      !isExportPublicName(name.slice(name.indexOf("/", 10) + 1))
    )
      throw exportError(
        `Comparison contains a private export resource: ${name}`,
      );
    inventory.add(`${prefix}/${name}`, bytes);
  }
  const changes = changedManifestRoutes(
    compilation.manifest,
    baseline,
    config,
    comparison.result.changedPaths,
  );
  const context: ShellContext = {
    base: comparison.result.baseRef,
    changedRoutes: [
      ...new Set([...changes, ...removed.map((entry) => entry.route)]),
    ],
    comparisons: true,
    updateVersion: 0,
    delivery,
  };
  inventory.add("index.html", homePage(catalogue, context));
  inventory.add(
    "404.html",
    notFoundPage("", catalogue, {
      ...context,
      delivery: { ...delivery, canonicalPath: "/404.html" },
    }),
  );
  for (const entry of entries) {
    if (!("route" in entry)) continue;
    const canonicalPath = catalogueViewHref(entry.route);
    const html = viewPage(entry, catalogue, {
      ...context,
      activeRoute: entry.route,
      delivery: { ...delivery, canonicalPath },
    });
    inventory.add(`view/${entry.route}`, html);
    if (
      "id" in entry &&
      typeof entry.id === "string" &&
      idRoutes[entry.id] === canonicalPath
    )
      inventory.add(`id/${entry.id}/index.html`, html);
  }
  for (const [name, bytes] of publicFiles) {
    const adapted = /\.html?$/i.test(name)
      ? adaptBrowseDocument(bytes.toString("utf8"), name, catalogue)
      : bytes;
    inventory.add(`static/${name}`, adapted);
  }
  inventory.add("__mokabook/shell.css", SHELL_CSS);
  for (const [name, bytes] of loadBrowserClientModules()) {
    if (name !== "browser.js" && name !== "live_updates.js")
      inventory.add(`__mokabook/client/${name}`, bytes);
  }
  for (const [name, bytes] of loadBrowserNavigationModules())
    inventory.add(`__mokabook/navigation/${name}`, bytes);
  for (const [name, bytes] of loadShellFontAssets())
    inventory.add(`__mokabook/fonts/${name}`, bytes);
  return { inventory, delivery };
}

function contentId(files: ReadonlyMap<string, ReviewArtifactContent>): string {
  const identities = [...files]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, bytes]) => [
      name,
      crypto.createHash("sha256").update(bytes).digest("hex"),
    ]);
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(identities))
    .digest("hex");
}
