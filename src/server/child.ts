import {
  parseRuntimeMessage,
  requestComponentRuntime,
} from "./controls/runtime_ipc.js";
import type { ResolvedConfig } from "../config/types.js";
import type { ManifestV5 } from "../registry/types.js";
import { bindTimings, timeSync } from "../diagnostics/timings.js";
import { startCatalogueServer } from "./http.js";
import { configuredServedReview } from "./review_routes.js";
import { parseChildUpdateMessage } from "./update_messages.js";

/** Run the hidden deterministic server child until its parent shuts it down. */
export async function runServerChild(
  config: ResolvedConfig,
  port: number,
  base: string,
  updateVersion: number,
  strictPort: boolean,
  retainedRuntime: boolean,
  manifest?: ManifestV5,
): Promise<void> {
  const server = await startCatalogueServer(config, {
    base,
    ...(manifest ? { manifest } : {}),
    port,
    review: configuredServedReview(config, base),
    strictPort,
    updateVersion,
  });
  const shutdown = waitForChildShutdown(server, config, manifest);
  process.send?.({ port: server.port, type: "ready", version: updateVersion });
  if (!process.send)
    process.stdout.write(`Mokabook listening at ${server.url}\n`);
  if (retainedRuntime) requestComponentRuntime();
  try {
    await shutdown;
  } finally {
    if (process.connected) process.disconnect?.();
  }
}

function waitForChildShutdown(
  server: Awaited<ReturnType<typeof startCatalogueServer>>,
  config: ResolvedConfig,
  manifest?: ManifestV5,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let closing = false;
    const cleanup = (): void => {
      process.off("disconnect", onDisconnect);
      process.off("message", receive);
      process.off("SIGINT", onSignal);
      process.off("SIGTERM", onSignal);
    };
    const close = async (): Promise<void> => {
      if (closing) return;
      closing = true;
      try {
        await server.close();
        cleanup();
        resolve();
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    const onMessage = (message: unknown): void => {
      const runtime = parseRuntimeMessage(message);
      if (runtime && manifest) {
        timeSync("runtime.attach", () =>
          server.replaceComponentRuntime({
            ...runtime.runtime,
            config,
            manifest,
          }),
        );
        if (runtime.version !== undefined)
          server.publishUpdate({ version: runtime.version });
      }
      const update = parseChildUpdateMessage(message);
      if (update)
        server.publishUpdate({
          changedRoutes: update.changedRoutes,
          componentChanges: update.componentChanges,
          version: update.version,
        });
      if (isMessage(message, "shutdown")) void close();
    };
    const onDisconnect = (): void => void close();
    const onSignal = (): void => void close();
    process.once("disconnect", onDisconnect);
    const receive = bindTimings(onMessage);
    process.on("message", receive);
    process.once("SIGINT", onSignal);
    process.once("SIGTERM", onSignal);
  });
}

function isMessage(value: unknown, type: string): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === type
  );
}
