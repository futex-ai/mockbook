/** Last-good runtime transfer over the watched child's private IPC channel. */
import type { ComponentRuntime } from "../../build/component_runtime.js";
import type { ResolvedConfig } from "../../config/types.js";
import type { ManifestV5 } from "../../registry/types.js";

/** Accepted configuration and manifest transferred before watched readiness. */
export interface RuntimeStartupMessage {
  config: ResolvedConfig;
  manifest: ManifestV5;
  type: "component-runtime-startup";
}

/** Heavy retained fields not already supplied in the startup message. */
export type TransferredComponentRuntime = Pick<
  ComponentRuntime,
  "bundle" | "generation" | "outputs"
>;

export interface RuntimeMessage {
  type: "component-runtime";
  runtime: TransferredComponentRuntime;
  /** Reserved update version published only after the runtime is attached. */
  version?: number;
}

/** Strip startup data from a retained-runtime IPC response. */
export function componentRuntimeMessage(
  runtime: ComponentRuntime,
  version?: number,
): RuntimeMessage {
  return {
    runtime: {
      bundle: runtime.bundle,
      generation: runtime.generation,
      outputs: runtime.outputs,
    },
    type: "component-runtime",
    ...(version === undefined ? {} : { version }),
  };
}

/** Ask the watched parent for its retained graph after server readiness. */
export function requestComponentRuntime(): void {
  process.send?.({ type: "component-runtime-request" });
}

/** Receive parent-validated metadata before the child checks its source inventory. */
export function receiveComponentRuntimeStartup(): Promise<RuntimeStartupMessage> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timer);
      process.off("message", onMessage);
      process.off("disconnect", onDisconnect);
    };
    const onDisconnect = (): void => {
      cleanup();
      reject(new Error("Parent disconnected before startup transfer"));
    };
    const onMessage = (value: unknown): void => {
      const message = parseRuntimeStartupMessage(value);
      if (!message) return;
      cleanup();
      resolve(message);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Consumer startup transfer timed out"));
    }, 10_000);
    process.on("message", onMessage);
    process.once("disconnect", onDisconnect);
    process.send?.({ type: "component-runtime-startup-request" });
  });
}

function parseRuntimeStartupMessage(
  value: unknown,
): RuntimeStartupMessage | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !("type" in value) ||
    value.type !== "component-runtime-startup" ||
    !("config" in value) ||
    !("manifest" in value)
  )
    return;
  const config = value.config as ResolvedConfig | undefined;
  const manifest = value.manifest as ManifestV5 | undefined;
  if (
    !config ||
    typeof config.configPath !== "string" ||
    typeof config.entriesDir !== "string" ||
    typeof config.mockupsDir !== "string" ||
    typeof config.repoRoot !== "string" ||
    !manifest ||
    !Array.isArray(manifest.entries) ||
    manifest.schemaVersion !== 5 ||
    !Array.isArray(manifest.sourceFiles)
  )
    return;
  return { config, manifest, type: "component-runtime-startup" };
}

export function parseRuntimeMessage(
  value: unknown,
): RuntimeMessage | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !("type" in value) ||
    value.type !== "component-runtime" ||
    !("runtime" in value)
  )
    return;
  const runtime = value.runtime as TransferredComponentRuntime | undefined;
  const version = "version" in value ? value.version : undefined;
  if (
    !runtime ||
    typeof runtime.generation !== "string" ||
    typeof runtime.bundle?.code !== "string" ||
    !Array.isArray(runtime.outputs) ||
    (version !== undefined &&
      (!Number.isSafeInteger(version) || (version as number) <= 0))
  )
    return;
  return {
    type: "component-runtime",
    runtime: {
      bundle: runtime.bundle,
      generation: runtime.generation,
      outputs: runtime.outputs,
    },
    ...(version === undefined ? {} : { version: version as number }),
  };
}
