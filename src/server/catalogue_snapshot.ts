import { assertFreshSourceInventory } from "../build/source_freshness.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError } from "../errors.js";
import type { CatalogueChangeSnapshot } from "../registry/changes.js";
import { parseManifest, readManifest } from "../registry/manifest.js";
import type { ManifestV4 } from "../registry/types.js";
import { createCatalogue, type Catalogue } from "./catalogue.js";

const configIdentity = Symbol("validated catalogue config");

/** Validated current catalogue and optional impact for the same generation. */
export interface CatalogueSnapshot {
  readonly [configIdentity]: ResolvedConfig;
  readonly catalogue: Catalogue;
  readonly changes?: CatalogueChangeSnapshot;
}

/** Read current metadata once; resolve impact from exactly that validated manifest. */
export async function loadCatalogueSnapshot(
  config: ResolvedConfig,
  resolveChanges?: (
    manifest: ManifestV4,
  ) => Promise<CatalogueChangeSnapshot | undefined>,
  manifest: ManifestV4 = readManifest(config),
): Promise<CatalogueSnapshot> {
  parseManifest(manifest);
  await assertFreshSourceInventory(config, manifest);
  const changes = await resolveChanges?.(manifest);
  return {
    [configIdentity]: config,
    catalogue: createCatalogue(manifest, changes?.removedEntries),
    ...(changes ? { changes } : {}),
  };
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
