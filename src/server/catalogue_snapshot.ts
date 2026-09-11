import type { ComponentChangeSnapshot } from "./component_changes.js";
import { assertFreshSourceInventory } from "../build/source_freshness.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError } from "../errors.js";
import type { CatalogueChangeSnapshot } from "../registry/changes.js";
import { parseManifest, readManifest } from "../registry/manifest.js";
import type { ManifestV5 } from "../registry/types.js";
import { createCatalogue, type Catalogue } from "./catalogue.js";
import {
  computeCatalogueChanges,
  type ResolvedCatalogueChanges,
} from "./changed.js";

const configIdentity = Symbol("validated catalogue config");

/** Validated current catalogue and optional impact for the same generation. */
export interface CatalogueSnapshot {
  readonly [configIdentity]: ResolvedConfig;
  readonly catalogue: Catalogue;
  readonly changes?: CatalogueChangeSnapshot;
  readonly componentChanges?: ComponentChangeSnapshot;
}

/** Read current metadata once; resolve impact from exactly that validated manifest. */
export async function loadCatalogueSnapshot(
  config: ResolvedConfig,
  resolveChanges?: (
    manifest: ManifestV5,
  ) => Promise<ResolvedCatalogueChanges | undefined>,
  manifest: ManifestV5 = readManifest(config),
): Promise<CatalogueSnapshot> {
  parseManifest(manifest);
  await assertFreshSourceInventory(config, manifest);
  const changes = await resolveChanges?.(manifest);
  return {
    [configIdentity]: config,
    catalogue: createCatalogue(manifest, changes?.removedEntries),
    ...(changes ? { changes } : {}),
    ...(changes?.componentChanges
      ? { componentChanges: changes.componentChanges }
      : {}),
  };
}

/** Validate startup metadata once, retaining Browse when optional history is unavailable. */
export function loadServedCatalogueSnapshot(
  config: ResolvedConfig,
  base?: string,
  manifest?: ManifestV5,
): Promise<CatalogueSnapshot> {
  return loadCatalogueSnapshot(
    config,
    base === undefined
      ? undefined
      : async (current) => {
          try {
            return await computeCatalogueChanges(
              config,
              base,
              undefined,
              current,
            );
          } catch (error) {
            if (
              error instanceof MokabookError &&
              error.code === "manifest-invalid"
            )
              throw error;
            return undefined;
          }
        },
    manifest,
  );
}

/** Reject snapshots from another configuration or outside the validation factory. */
export function catalogueSnapshotForConfig(
  snapshot: CatalogueSnapshot,
  config: ResolvedConfig,
): CatalogueSnapshot {
  if (snapshot[configIdentity] !== config)
    throw new MokabookError(
      "manifest-invalid",
      "catalogue snapshot does not belong to this configuration",
    );
  return snapshot;
}
