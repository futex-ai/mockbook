import http, { type ServerResponse } from "node:http";

import { assertFreshSourceInventory } from "../build/source_freshness.js";
import { encodeUrlPath } from "../config/paths.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError } from "../errors.js";
import { readManifest } from "../registry/manifest.js";
import {
  openEventStream,
  serveClientModule,
  serveFontAsset,
  type ServedAssets,
} from "./browser_assets.js";
import { createCatalogue, type Catalogue } from "./catalogue.js";
import {
  loadBrowserClientModules,
  loadBrowserNavigationModules,
  loadShellFontAssets,
} from "./client_modules.js";
import { homePage, notFoundPage, viewPage } from "./pages.js";
import { computeCatalogueChanges } from "./changed.js";
import type { CatalogueChangeSnapshot } from "../registry/changes.js";
import { requestedFragment, withFragmentQuery } from "./fragments.js";
import { listenOnAvailablePort } from "./ports.js";
import { safeDecode, safeDecodePath, send } from "./respond.js";
import { ReviewRoutes, type ServedReview } from "./review_routes.js";
import { shellContext, type ShellContext } from "./shell/context.js";
import { SHELL_CSS } from "./shell/css.js";
import { serveStatic } from "./static_routes.js";
import type { CatalogueUpdate } from "./update_messages.js";

/** Options for one deterministic server child. */
export interface ServerOptions {
  base: string;
  changedRoutes?: readonly string[];
  changes?: CatalogueChangeSnapshot;
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
  port: number;
  url: string;
}

/** Start Browse only after manifest validation succeeds. */
export async function startCatalogueServer(
  config: ResolvedConfig,
  options: ServerOptions,
): Promise<RunningServer> {
  const manifest = readManifest(config);
  await assertFreshSourceInventory(config, manifest);
  let changes = options.changes;
  if (!changes && options.review) {
    try {
      changes = await computeCatalogueChanges(config, options.base);
    } catch (error) {
      if (error instanceof MokabookError && error.code === "manifest-invalid")
        throw error;
    }
  }
  const catalogue = createCatalogue(manifest, changes?.removedEntries);
  const clientModules = loadBrowserClientModules();
  const navigationModules = loadBrowserNavigationModules();
  const fontAssets = loadShellFontAssets();
  const streams = new Set<ServerResponse>();
  const reviewRoutes = options.review
    ? new ReviewRoutes(options.review)
    : undefined;
  let changedRoutes = changes?.changedRoutes ?? options.changedRoutes;
  let updateVersion = options.updateVersion ?? 1;
  const server = http.createServer((request, response) => {
    handleRequest(
      request.url ?? "/",
      request.method ?? "GET",
      response,
      catalogue,
      config,
      options.base,
      () => changedRoutes,
      streams,
      { clientModules, fontAssets, navigationModules },
      () => updateVersion,
      reviewRoutes,
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
      const results = await Promise.allSettled([serverClosing, reviewClosing]);
      for (const result of results) {
        if (result.status === "rejected") throw result.reason;
      }
    },
    port: address.port,
    publishUpdate(update = {}): void {
      const nextVersion = update.version ?? updateVersion + 1;
      if (!Number.isSafeInteger(nextVersion) || nextVersion <= updateVersion)
        return;
      if (Object.hasOwn(update, "changedRoutes")) {
        changedRoutes = update.changedRoutes ?? undefined;
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
): void {
  if (method !== "GET" && method !== "HEAD")
    return send(response, 405, "text/plain", "Method not allowed", method);
  const url = new URL(rawUrl, "http://mokabook.invalid");
  const requestVersion = currentVersion();
  const changed = currentChangedRoutes();
  const context = shellContext(
    base,
    changed
      ? [
          ...new Set([
            ...changed,
            ...catalogue.removedScreens.map((screen) => screen.route),
          ]),
        ]
      : undefined,
    requestVersion,
  );
  context.comparisons = reviewRoutes !== undefined;
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

function redirectId(
  response: ServerResponse,
  url: URL,
  encodedId: string,
  catalogue: Catalogue,
  config: ResolvedConfig,
  context: ShellContext,
  method: string,
): void {
  const entry = catalogue.byId.get(safeDecode(encodedId));
  if (!entry || entry.kind === "collection")
    return send(
      response,
      404,
      "text/html",
      notFoundPage(encodedId, catalogue, context),
      method,
    );
  const fragment = requestedFragment(url, entry, catalogue, config);
  if (fragment === null) {
    return send(response, 400, "text/plain", "Invalid fragment query", method);
  }
  response.writeHead(302, {
    location: withFragmentQuery(
      `/view/${encodeUrlPath(entry.route)}`,
      fragment,
    ),
  });
  response.end();
}

function renderView(
  response: ServerResponse,
  url: URL,
  encodedRoute: string,
  catalogue: Catalogue,
  config: ResolvedConfig,
  context: ShellContext,
  method: string,
): void {
  const route = safeDecodePath(encodedRoute);
  const entry = route
    ? (catalogue.byRoute.get(route) ??
      catalogue.removedEntries.find(({ entry }) => entry.route === route)
        ?.entry)
    : undefined;
  if (!entry)
    return send(
      response,
      404,
      "text/html",
      notFoundPage(encodedRoute, catalogue, context),
      method,
    );
  const manifestEntry = "kind" in entry ? entry : undefined;
  const removed = catalogue.removedEntries.some(
    ({ entry }) => entry.route === route,
  );
  const fragment = removed
    ? url.searchParams.has("fragment")
      ? null
      : undefined
    : requestedFragment(url, manifestEntry, catalogue, config);
  if (fragment === null) {
    return send(response, 400, "text/plain", "Invalid fragment query", method);
  }
  const viewContext = {
    ...context,
    ...(route ? { activeRoute: route } : {}),
    ...(fragment ? { fragment } : {}),
  };
  return send(
    response,
    200,
    "text/html",
    viewPage(entry, catalogue, viewContext),
    method,
  );
}
