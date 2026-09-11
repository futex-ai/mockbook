import type { ComponentRuntime } from "../build/component_runtime.js";
import { ComponentRenderService } from "./controls/service.js";
import { handleControls, localHost } from "./controls/http.js";
import http, { type ServerResponse } from "node:http";

import type { ResolvedConfig } from "../config/types.js";
import { MokabookError } from "../errors.js";
import {
  catalogueSnapshotForConfig,
  loadServedCatalogueSnapshot,
  type CatalogueSnapshot,
} from "./catalogue_snapshot.js";
import {
  ComponentChangeCache,
  RepositoryComponentChanges,
  type ComponentChangeSource,
  type ComponentChangeSnapshot,
} from "./component_changes.js";
import { catalogueAtBaseline } from "./catalogue.js";
import {
  loadBrowserClientModules,
  loadBrowserNavigationModules,
  loadShellFontAssets,
} from "./client_modules.js";
import { handleCatalogueRequest } from "./http_routes.js";
import { listenOnAvailablePort } from "./ports.js";
import { ReviewRoutes, type ServedReview } from "./review_routes.js";
import { send } from "./respond.js";
import type { CatalogueUpdate } from "./update_messages.js";

/** Options for one deterministic server child. */
export interface ServerOptions {
  base: string;
  /** Reuse a validated startup or publication generation without rereading metadata. */
  snapshot?: CatalogueSnapshot;
  componentRuntime?: ComponentRuntime;
  changedRoutes?: readonly string[];
  /** Read-only component classification source for the immutable server generation. */
  componentChangeSource?: ComponentChangeSource;
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
  const snapshot =
    options.snapshot ??
    (await loadServedCatalogueSnapshot(
      config,
      options.review ? options.base : undefined,
    ));
  const { catalogue, changes } = catalogueSnapshotForConfig(snapshot, config);
  const manifest = catalogue.manifest;
  const controls = options.componentRuntime
    ? new ComponentRenderService(options.componentRuntime)
    : undefined;
  const clientModules = loadBrowserClientModules();
  const navigationModules = loadBrowserNavigationModules();
  const fontAssets = loadShellFontAssets();
  const streams = new Set<ServerResponse>();
  const reviewRoutes = options.review
    ? new ReviewRoutes(options.review)
    : undefined;
  const componentChanges =
    options.snapshot && !options.componentChangeSource
      ? undefined
      : new ComponentChangeCache(
          options.componentChangeSource ??
            new RepositoryComponentChanges(config, manifest, options.base),
        );
  let changedRoutes =
    changes?.changedRoutes ??
    (options.review ? options.changedRoutes : undefined);
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
    const serve = (evidence?: ComponentChangeSnapshot) =>
      handleCatalogueRequest(
        request.url ?? "/",
        request.method ?? "GET",
        response,
        evidence ? catalogueAtBaseline(manifest, evidence.baseline) : catalogue,
        config,
        options.base,
        () => requestedChanges,
        streams,
        { clientModules, fontAssets, navigationModules },
        () => requestedVersion,
        reviewRoutes,
        evidence,
        controls?.capability(),
      );
    if (
      componentChanges &&
      options.review &&
      (new URL(request.url ?? "/", "http://mokabook.invalid").pathname ===
        "/" ||
        request.url?.startsWith("/view/") ||
        request.url?.startsWith("/id/"))
    )
      void componentChanges
        .read(requestedVersion)
        .then(serve)
        .catch(() =>
          send(
            response,
            500,
            "text/plain",
            "Catalogue unavailable",
            request.method ?? "GET",
          ),
        );
    else serve(options.snapshot ? snapshot.componentChanges : undefined);
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
      controls?.replace(runtime);
    },
    publishUpdate(update = {}): void {
      const nextVersion = update.version ?? updateVersion + 1;
      if (!Number.isSafeInteger(nextVersion) || nextVersion <= updateVersion)
        return;
      if (Object.hasOwn(update, "changedRoutes")) {
        changedRoutes = update.changedRoutes ?? undefined;
      }
      updateVersion = nextVersion;
      reviewRoutes?.invalidate();
      componentChanges?.invalidate();
      const payload = `event: update\ndata: ${updateVersion}\n\n`;
      for (const stream of streams) stream.write(payload);
    },
    url: `http://127.0.0.1:${address.port}`,
  };
}
