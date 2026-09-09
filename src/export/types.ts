import type { StaticDelivery } from "../navigation/delivery.js";
import type { ReviewArtifactContent } from "../review/types.js";
import type { LegacyExportOwnership } from "./ownership.js";

/** Paths produced by one completed static export. */
export interface ExportResult {
  outDir: string;
  comparisonUrl: string;
  idRoutes: StaticDelivery["idRoutes"];
}

/** Repository-only staging adapter; consumer deployment is outside the CLI. */
export interface ExportAdapter {
  legacyOwnership?: LegacyExportOwnership;
  transform(
    files: Map<string, ReviewArtifactContent>,
    result: ExportResult,
  ):
    | void
    | ReadonlyMap<string, string>
    | Promise<void | ReadonlyMap<string, string>>;
}

/** One explicit export request, with optional cancellation and internal adapter. */
export interface ExportOptions {
  outDir: string;
  base?: string;
  signal?: AbortSignal;
  adapter?: ExportAdapter;
}
