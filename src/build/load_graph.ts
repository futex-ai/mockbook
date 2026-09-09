import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { graphSourceFiles, normalizeSourceFiles } from "./source_inventory.js";
import { build } from "esbuild";

import type { RegistryDefinition } from "../authoring/types.js";
import type { CompatibilityTransformer } from "../compatibility/types.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError, errorMessage } from "../errors.js";
import type { Renderer } from "../renderer/types.js";
import { discoverEntryModules } from "./discovery.js";
import {
  consumerReactPlugin,
  packageNodePaths,
} from "./consumer_resolution.js";
import {
  CONSUMER_ENTRY_PATH,
  consumerEntryPlugin,
  packageApiPlugin,
} from "./consumer_entry.js";

/** Consumer modules loaded in one React-safe esbuild graph. */
export interface LoadedGraph {
  compatibilityTransformer?: CompatibilityTransformer;
  definitions: unknown[];
  entrySources: readonly string[];
  sourceFiles: readonly string[];
  renderer: Renderer;
}

/** Bundle and import all React-bearing consumer modules as one graph. */
export async function loadConsumerGraph(
  config: ResolvedConfig,
  evaluate = true,
): Promise<LoadedGraph> {
  const entrySources = discoverEntryModules(config.entriesDir);
  const temporaryDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), "mokabook-graph-"),
  );
  const outputPath = path.join(temporaryDir, "consumer.cjs");
  try {
    const result = await build({
      metafile: true,
      preserveSymlinks: true,
      absWorkingDir: path.dirname(config.configPath),
      alias: config.moduleResolution.aliases,
      bundle: true,
      ...(config.moduleResolution.conditions
        ? { conditions: [...config.moduleResolution.conditions] }
        : {}),
      entryPoints: [CONSUMER_ENTRY_PATH],
      format: "cjs",
      jsx: "automatic",
      loader: config.moduleResolution.loaders,
      logLevel: "silent",
      ...(config.moduleResolution.mainFields
        ? { mainFields: [...config.moduleResolution.mainFields] }
        : {}),
      nodePaths: packageNodePaths(config),
      outfile: outputPath,
      platform: "node",
      plugins: [
        consumerEntryPlugin(config, entrySources),
        packageApiPlugin(config),
        consumerReactPlugin(config),
      ],
      ...(config.moduleResolution.resolveExtensions
        ? { resolveExtensions: [...config.moduleResolution.resolveExtensions] }
        : {}),
      target: "node22",
    });
    const sourceFiles = normalizeSourceFiles(
      [
        ...graphSourceFiles(
          result.metafile,
          path.dirname(config.configPath),
          config.repoRoot,
        ),
        ...(config.configSourceFiles ?? [config.configPath]),
        ...entrySources,
        ...(config.renderer ? [config.renderer] : []),
        ...(config.compatibility.transformer
          ? [config.compatibility.transformer]
          : []),
      ],
      config.repoRoot,
    );
    if (!evaluate)
      return {
        definitions: [],
        entrySources,
        sourceFiles,
        renderer: () => {
          throw new Error("inventory-only graph cannot render");
        },
      };
    const imported = createRequire(import.meta.url)(outputPath) as {
      compatibilityTransformer?: unknown;
      definitions: unknown[];
      renderer: unknown;
    };
    if (typeof imported.renderer !== "function") {
      throw new MokabookError(
        "build-invalid",
        "renderer module must default-export a function",
      );
    }
    if (
      config.compatibility.transformer &&
      typeof imported.compatibilityTransformer !== "function"
    ) {
      throw new MokabookError(
        "build-invalid",
        "compatibility transformer module must default-export a function",
      );
    }
    return {
      ...(typeof imported.compatibilityTransformer === "function"
        ? {
            compatibilityTransformer:
              imported.compatibilityTransformer as CompatibilityTransformer,
          }
        : {}),
      definitions: imported.definitions,
      entrySources,
      sourceFiles,
      renderer: imported.renderer as Renderer,
    };
  } catch (error) {
    if (error instanceof MokabookError) throw error;
    throw new MokabookError(
      "build-invalid",
      `could not bundle consumer modules: ${errorMessage(error)}`,
      {
        cause: error,
      },
    );
  } finally {
    await fs.promises.rm(temporaryDir, { force: true, recursive: true });
  }
}

/** Narrow an unknown loaded value after runtime validation. */
export function asRegistryDefinition(
  value: unknown,
): RegistryDefinition | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as RegistryDefinition)
    : undefined;
}
