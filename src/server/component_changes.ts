import path from "node:path";

import { projectRealPath, toPosixPath } from "../config/paths.js";
import type { ResolvedConfig } from "../config/types.js";
import type { Manifest } from "../registry/types.js";
import {
  FileSystemReviewAssetReader,
  GitReviewAssetReader,
} from "../review/assets.js";
import { readBaseManifest } from "../review/base_manifest.js";
import { reviewChangedPaths } from "../review/changed_paths.js";
import { classifyComponents } from "../review/component_classification.js";
import type { ReviewResultV3 } from "../review/component_types.js";
import { NodeGitCommandRunner, RepositoryGitClient } from "../review/git.js";
import { changedContentPaths } from "./changed_content.js";
import { changedManifestRoutes } from "./changed.js";

export interface ComponentChangeSnapshot {
  baseline: Manifest;
  changedRoutes?: readonly string[];
  result?: ReviewResultV3;
}
export interface ComponentChangeSource {
  baseline(): Promise<string>;
  read(commit: string): Promise<ComponentChangeSnapshot | undefined>;
}

/** Read-only catalogue classification boundary used outside the HTTP child. */
export interface CatalogueChangeClassifier {
  read(
    config: ResolvedConfig,
    manifest: Manifest,
    base: string,
    signal?: AbortSignal,
  ): Promise<ComponentChangeSnapshot | undefined>;
}

/** Classify one generated catalogue against its repository branch point. */
export class RepositoryCatalogueChangeClassifier implements CatalogueChangeClassifier {
  async read(
    config: ResolvedConfig,
    manifest: Manifest,
    base: string,
    signal?: AbortSignal,
  ): Promise<ComponentChangeSnapshot | undefined> {
    try {
      const source = new RepositoryComponentChanges(
        config,
        manifest,
        base,
        signal,
      );
      signal?.throwIfAborted();
      const baseline = await source.baseline();
      signal?.throwIfAborted();
      return source.read(baseline);
    } catch {
      return undefined;
    }
  }
}

/** Retain one immutable classification; resolving the baseline never creates Review artifacts. */
export class ComponentChangeCache {
  private cached:
    | {
        sequence: number;
        key: string;
        result: Promise<ComponentChangeSnapshot | undefined>;
      }
    | undefined;
  private epoch = 0;
  private sequence = 0;
  constructor(private readonly source: ComponentChangeSource) {}
  invalidate(): void {
    this.epoch++;
    this.cached = undefined;
  }
  async read(generation: number): Promise<ComponentChangeSnapshot | undefined> {
    const epoch = this.epoch;
    const sequence = ++this.sequence;
    try {
      const baseline = await this.source.baseline();
      const key = `${epoch}:${generation}:${baseline}`;
      if (this.cached?.key === key) return this.cached.result;
      const result = this.source.read(baseline).catch(() => undefined);
      if (epoch === this.epoch && sequence >= (this.cached?.sequence ?? 0))
        this.cached = { sequence, key, result };
      return result;
    } catch {
      return undefined;
    }
  }
}

/** Production read boundary for a last-good catalogue and its current Git branch point. */
export class RepositoryComponentChanges implements ComponentChangeSource {
  private readonly runner: NodeGitCommandRunner;
  private readonly git: RepositoryGitClient;
  constructor(
    private readonly config: ResolvedConfig,
    private readonly manifest: Manifest,
    private readonly base: string,
    signal?: AbortSignal,
  ) {
    this.runner = new NodeGitCommandRunner(config.repoRoot, signal);
    this.git = new RepositoryGitClient(this.runner);
  }
  async baseline(): Promise<string> {
    if (
      projectRealPath(
        (await this.runner.run(["rev-parse", "--show-toplevel"])).trim(),
      ) !== projectRealPath(this.config.repoRoot)
    )
      throw new Error("Comparison requires the configured repository root");
    return this.git.mergeBase(this.base, "HEAD");
  }
  async read(commit: string): Promise<ComponentChangeSnapshot | undefined> {
    const baseline = await readBaseManifest(this.git, commit, this.config);
    const changedPaths = await reviewChangedPaths(
      this.git,
      commit,
      this.config,
      this.config.review.outDir,
    );
    if (baseline.schemaVersion !== 4 && this.manifest.schemaVersion !== 4) {
      const contentChanges = await changedContentPaths(
        this.manifest,
        baseline,
        this.config,
        this.git,
        commit,
        changedPaths,
      );
      return {
        baseline,
        changedRoutes: changedManifestRoutes(
          this.manifest,
          baseline,
          this.config,
          contentChanges,
        ),
      };
    }
    const prefix = toPosixPath(
      path.relative(this.config.repoRoot, this.config.mockupsDir),
    );
    const result = await classifyComponents({
      before: baseline,
      after: this.manifest,
      config: this.config,
      baseCommit: commit,
      baseRef: this.base,
      changedPaths,
      beforeReader: new GitReviewAssetReader(
        this.config,
        this.git,
        commit,
        prefix,
      ),
      afterReader: new FileSystemReviewAssetReader(this.config),
    });
    return {
      baseline,
      changedRoutes: result.changes
        .map((entry) => (entry.after ?? entry.before)!.route)
        .sort(),
      result,
    };
  }
}
