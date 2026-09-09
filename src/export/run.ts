import fs from "node:fs";
import path from "node:path";

import { compileCatalogue } from "../build/compile.js";
import { writeCompilation } from "../build/transaction.js";
import type { ResolvedConfig } from "../config/types.js";
import { projectRealPath } from "../config/paths.js";
import { MokabookError, errorMessage } from "../errors.js";
import { readBaseManifest } from "../review/base_manifest.js";
import { reviewChangedPaths } from "../review/changed_paths.js";
import { compareReview } from "../review/compare.js";
import { NodeGitCommandRunner, RepositoryGitClient } from "../review/git.js";
import { changedContentPaths } from "../server/changed_content.js";
import { withExportCleanup } from "./cleanup.js";
import { finalizeDeployment } from "./deployment.js";
import { assertExportActive, exportError } from "./error.js";
import {
  assertInputsUnchanged,
  capturedAssetReader,
  pinnedGit,
} from "./inputs.js";
import { ExportInventory } from "./inventory.js";
import { EXPORT_MARKER } from "./ownership.js";
import { resolveExportOutput } from "./paths.js";
import { capturePublicFiles } from "./public_files.js";
import { validateExportReferences } from "./references.js";
import { assembleExport } from "./site.js";
import { ExportTransaction } from "./transaction.js";
import type { ExportOptions, ExportResult, ExportRoutes } from "./types.js";

/** Build and transactionally export a consumer's complete static catalogue. */
export async function exportCatalogue(
  config: ResolvedConfig,
  options: ExportOptions,
): Promise<ExportResult> {
  const outputRoot = options.adapter?.outputRoot;
  const output = resolveExportOutput(config, options.outDir, outputRoot);
  assertExportActive(options.signal);
  const transaction = await ExportTransaction.open(
    output,
    options.adapter?.legacyOwnership,
  );
  return withExportCleanup(
    () => generateExport(config, options, output, transaction, outputRoot),
    () => transaction.close(),
  );
}

async function generateExport(
  config: ResolvedConfig,
  options: ExportOptions,
  output: string,
  transaction: ExportTransaction,
  outputRoot?: string,
): Promise<ExportResult> {
  try {
    const git = new RepositoryGitClient(
      new NodeGitCommandRunner(config.repoRoot),
    );
    const base = options.base ?? config.review.base;
    const commit = await git.mergeBase(base, "HEAD");
    const baseline = await readBaseManifest(git, commit, config);
    const compilation = await compileCatalogue(config);
    assertExportActive(options.signal);
    await writeCompilation(compilation, config);
    const publicFiles = await capturePublicFiles(config);
    const assetReader = capturedAssetReader(publicFiles);
    const exclusions = [output, transaction.reservationRoot];
    const changed = await reviewChangedPaths(
      git,
      commit,
      config,
      config.review.outDir,
      exclusions,
    );
    const comparison = await compareReview(
      compilation,
      config,
      pinnedGit(git, commit, changed),
      base,
      transaction.stage,
      assetReader,
      exclusions,
    );
    const contentChanges = await changedContentPaths(
      compilation.manifest,
      baseline,
      config,
      git,
      commit,
      changed,
      assetReader,
    );
    const site = assembleExport(
      config,
      compilation,
      baseline,
      comparison,
      publicFiles,
      contentChanges,
    );
    const routes: ExportRoutes = Object.freeze({
      outDir: output,
      comparisonUrl: site.delivery.comparisonUrl,
      idRoutes: Object.freeze({ ...site.delivery.idRoutes }),
    });
    const aliases = new Map(
      (await options.adapter?.transform(site.inventory.files, routes)) ?? [],
    );
    const files = new ExportInventory();
    for (const [name, bytes] of site.inventory.files)
      files.add(name, Buffer.from(bytes));
    files.add(
      EXPORT_MARKER,
      `${JSON.stringify({ schemaVersion: 1, files: [...files.files.keys()].sort() }, null, 2)}\n`,
    );
    validateExportReferences(files.files, aliases);
    const deploymentId = finalizeDeployment(files.files, site.shells, aliases);
    for (const [name, bytes] of files.files) {
      assertExportActive(options.signal);
      const target = path.join(transaction.stage, name);
      await fs.promises.mkdir(path.dirname(target), { recursive: true });
      await fs.promises.writeFile(target, bytes);
    }
    await assertInputsUnchanged(
      config,
      compilation,
      publicFiles,
      git,
      commit,
      changed,
      exclusions,
    );
    assertExportActive(options.signal);
    if (
      projectRealPath(resolveExportOutput(config, output, outputRoot)) !==
      transaction.output
    )
      throw exportError(
        "Export output changed its real location during export.",
      );
    await transaction.install(options.signal);
    return { ...routes, deploymentId };
  } catch (error) {
    if (error instanceof MokabookError) throw error;
    throw exportError(
      `Could not export catalogue: ${errorMessage(error)}`,
      error,
    );
  }
}
