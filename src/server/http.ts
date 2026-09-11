import type { ComponentRuntime } from "../build/component_runtime.js";
import type { RenderCapability } from "../components/render_types.js";
import { ComponentRenderService } from "./controls/service.js";
import { handleControls, localHost } from "./controls/http.js";
import { redirectId, renderView } from "./view_routes.js";
import http, { type ServerResponse } from "node:http";

import type { ResolvedConfig } from "../config/types.js";
import { MokabookError } from "../errors.js";
import { readManifest } from "../registry/manifest.js";
import type { Manifest } from "../registry/types.js";
import {
  openEventStream,
  serveClientModule,
  serveFontAsset,
  type ServedAssets,
} from "./browser_assets.js";
import { type ComponentChangeSnapshot } from "./component_changes.js";
import {
  catalogueAtBaseline,
  createCatalogue,
  type Catalogue,
} from "./catalogue.js";
import {
  loadBrowserClientModules,
  loadBrowserNavigationModules,
  loadShellFontAssets,
} from "./client_modules.js";
import { homePage, notFoundPage } from "./pages.js";
import { listenOnAvailablePort } from "./ports.js";
import { send } from "./respond.js";
import { ReviewRoutes, type ServedReview } from "./review_routes.js";
import { shellContext } from "./shell/context.js";
import { SHELL_CSS } from "./shell/css.js";
import { serveStatic } from "./static_routes.js";
import type { CatalogueUpdate } from "./update_messages.js";

/** Options for one deterministic server child. */
export interface ServerOptions {
  base: string;
  componentRuntime?: ComponentRuntime;
  changedRoutes?: readonly string[];
  /** Precomputed component and screen evidence for the immutable generation. */
  componentChanges?: ComponentChangeSnapshot;
  /** Parent-validated manifest supplied to a watched server child. */
  manifest?: Manifest;
  port: number;
  /** Enables on-demand comparison JSON and isolated snapshots. */
  review?: ServedReview;
  strictPort?: boolean;
  updateVersion?: number;
}

/** Running server lifecycle and update-stream boundary. */
export interface RunningServer {
  close(): Promise<void>;
  publishUpdate(update?: CatalogueUpdate): void;
  replaceComponentRuntime(runtime: ComponentRuntime): void;
  port: number;
  url: string;
}

/** Start Browse only after manifest validation succeeds. */
export async function startCatalogueServer(
  config: ResolvedConfig,
  options: ServerOptions,
): Promise<RunningServer> {
  const manifest = options.manifest ?? readManifest(config);
  let controls = options.componentRuntime
    ? new ComponentRenderService(options.componentRuntime)
    : undefined;
  const catalogue = createCatalogue(manifest);
  let activeCatalogue = options.componentChanges
    ? catalogueAtBaseline(manifest, options.componentChanges.baseline)
    : catalogue;
  const clientModules = loadBrowserClientModules();
  const navigationModules = loadBrowserNavigationModules();
  const fontAssets = loadShellFontAssets();
  const streams = new Set<ServerResponse>();
  const reviewRoutes = options.review
    ? new ReviewRoutes(options.review)
    : undefined;
  let componentChanges = options.componentChanges;
  let changedRoutes =
    options.changedRoutes ?? options.componentChanges?.changedRoutes;
  let updateVersion = options.updateVersion ?? 1;
  const server = http.createServer((request, response) => {
    if (controls && !localHost(request))
      return send(
        response,
        403,
        "text/plain",
        "This request is not allowed.",
        request.method ?? "GET",
      );
    if (controls && request.url?.startsWith("/__mokabook/components/")) {
      void handleControls(request, response, controls);
      return;
    }
    const requestedVersion = updateVersion;
    const requestedChanges = changedRoutes;
    handleRequest(
      request.url ?? "/",
      request.method ?? "GET",
      response,
      activeCatalogue,
      config,
      options.base,
      () => requestedChanges,
      streams,
      { clientModules, fontAssets, navigationModules },
      () => requestedVersion,
      reviewRoutes,
      componentChanges,
      controls?.capability(),
    );
  });
  await listenOnAvailablePort(
    server,
    options.port,
    options.strictPort ?? false,
  );
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new MokabookError(
      "server-failed",
      "server did not expose a TCP address",
    );
  }
  return {
    async close(): Promise<void> {
      for (const stream of streams) stream.end();
      const serverClosing = new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      const reviewClosing = reviewRoutes?.close() ?? Promise.resolve();
      const results = await Promise.allSettled([
        serverClosing,
        reviewClosing,
        controls?.close(),
      ]);
      for (const result of results) {
        if (result.status === "rejected") throw result.reason;
      }
    },
    port: address.port,
    replaceComponentRuntime(runtime): void {
      if (controls) controls.replace(runtime);
      else controls = new ComponentRenderService(runtime);
    },
    publishUpdate(update = {}): void {
      const nextVersion = update.version ?? updateVersion + 1;
      if (!Number.isSafeInteger(nextVersion) || nextVersion <= updateVersion)
        return;
      if (Object.hasOwn(update, "changedRoutes")) {
        changedRoutes = update.changedRoutes ?? undefined;
      }
      if (Object.hasOwn(update, "componentChanges")) {
        componentChanges = update.componentChanges ?? undefined;
        activeCatalogue = componentChanges
          ? catalogueAtBaseline(manifest, componentChanges.baseline)
          : catalogue;
      }
      updateVersion = nextVersion;
      reviewRoutes?.invalidate();
      const payload = `event: update\ndata: ${updateVersion}\n\n`;
      for (const stream of streams) stream.write(payload);
    },
    url: `http://127.0.0.1:${address.port}`,
  };
}

function handleRequest(
  rawUrl: string,
  method: string,
  response: ServerResponse,
  catalogue: Catalogue,
  config: ResolvedConfig,
  base: string,
  currentChangedRoutes: () => readonly string[] | undefined,
  streams: Set<ServerResponse>,
  assets: ServedAssets,
  currentVersion: () => number,
  reviewRoutes?: ReviewRoutes,
  componentChanges?: ComponentChangeSnapshot,
  renderCapability?: RenderCapability,
): void {
  if (method !== "GET" && method !== "HEAD")
    return send(response, 405, "text/plain", "Method not allowed", method);
  const url = new URL(rawUrl, "http://mokabook.invalid");
  const requestVersion = currentVersion();
  const changed = componentChanges?.result
    ? componentChanges.result.changes.map(
        (entry) => (entry.after ?? entry.before)!.route,
      )
    : currentChangedRoutes();
  const context = shellContext(
    base,
    changed
      ? [
          ...new Set([
            ...changed,
            ...[
              ...catalogue.removedScreens,
              ...catalogue.removedComponents,
            ].map((entry) => entry.route),
          ]),
        ]
      : undefined,
    requestVersion,
  );
  if (renderCapability) context.renderCapability = renderCapability;
  context.comparisons = reviewRoutes !== undefined;
  if (componentChanges) context.componentChanges = componentChanges;
  if (url.pathname === "/")
    return send(
      response,
      200,
      "text/html",
      homePage(catalogue, context),
      method,
    );
  if (reviewRoutes && url.pathname.startsWith("/__mokabook/diffs/")) {
    void reviewRoutes.handle(url, response, method);
    return;
  }
  if (url.pathname === "/__mokabook/shell.css")
    return send(response, 200, "text/css", SHELL_CSS, method);
  if (url.pathname === "/__mokabook/events")
    return openEventStream(response, streams, requestVersion, method);
  if (url.pathname.startsWith("/__mokabook/client/")) {
    return serveClientModule(
      response,
      url.pathname.slice("/__mokabook/client/".length),
      assets.clientModules,
      method,
    );
  }
  if (url.pathname.startsWith("/__mokabook/navigation/")) {
    return serveClientModule(
      response,
      url.pathname.slice("/__mokabook/navigation/".length),
      assets.navigationModules,
      method,
    );
  }
  if (url.pathname.startsWith("/__mokabook/fonts/")) {
    return serveFontAsset(
      response,
      url.pathname.slice("/__mokabook/fonts/".length),
      assets.fontAssets,
      method,
    );
  }
  if (url.pathname.startsWith("/id/"))
    return redirectId(
      response,
      url,
      url.pathname.slice(4),
      catalogue,
      config,
      context,
      method,
    );
  if (url.pathname.startsWith("/view/"))
    return renderView(
      response,
      url,
      url.pathname.slice(6),
      catalogue,
      config,
      context,
      method,
    );
  if (url.pathname.startsWith("/static/"))
    return serveStatic(
      response,
      url.pathname.slice(8),
      config,
      catalogue,
      method,
    );
  return send(
    response,
    404,
    "text/html",
    notFoundPage(url.pathname, catalogue, context),
    method,
  );
}
