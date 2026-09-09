import type { ServerResponse } from "node:http";

import { encodeUrlPath } from "../config/paths.js";
import type { ResolvedConfig } from "../config/types.js";
import {
  openEventStream,
  serveClientModule,
  serveFontAsset,
  type ServedAssets,
} from "./browser_assets.js";
import type { Catalogue } from "./catalogue.js";
import { requestedFragment, withFragmentQuery } from "./fragments.js";
import { homePage, notFoundPage, viewPage } from "./pages.js";
import { safeDecode, safeDecodePath, send } from "./respond.js";
import type { ReviewRoutes } from "./review_routes.js";
import { shellContext, type ShellContext } from "./shell/context.js";
import { SHELL_CSS } from "./shell/css.js";
import { serveStatic } from "./static_routes.js";

/** Dispatch a request against one validated catalogue generation. */
export function handleCatalogueRequest(
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
