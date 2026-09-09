import fs from "node:fs";
import path from "node:path";

import { isInside, isSafeRepositoryPath } from "../config/paths.js";
import type { ResolvedConfig } from "../config/types.js";
import { MokabookError, errorMessage } from "../errors.js";
import { referencedRoutes } from "./asset_references.js";
import type { GitClient, GitFile } from "./git.js";
import { addArtifactFile, snapshotPath } from "./paths.js";
import type { ReviewArtifactContent } from "./types.js";

/** Filesystem boundary for current-worktree Review assets. */
export interface ReviewAssetReader {
  read(route: string): Promise<Uint8Array>;
}

/** A worktree reader that distinguishes absent files from invalid resources. */
export interface OptionalReviewAssetReader extends ReviewAssetReader {
  /** Missing paths still require a confined, existing public ancestor. */
  readIfExists(route: string): Promise<Uint8Array | undefined>;
}

/** Confined filesystem implementation for current-worktree Review assets. */
export class FileSystemReviewAssetReader implements OptionalReviewAssetReader {
  constructor(private readonly config: ResolvedConfig) {}

  async read(route: string): Promise<Uint8Array> {
    const content = await this.readIfExists(route);
    if (content === undefined) throw assetError(route, "file is missing");
    return content;
  }

  async readIfExists(route: string): Promise<Uint8Array | undefined> {
    const candidate = assertPublicStaticRoute(route, this.config);
    try {
      const existing = await closestExistingPath(candidate);
      const [realRoot, realCandidate] = await Promise.all([
        fs.promises.realpath(this.config.mockupsDir),
        fs.promises.realpath(existing),
      ]);
      const sourceRoots = await Promise.all([
        fs.promises.realpath(this.config.entriesDir),
        ...(this.config.legacy
          ? [fs.promises.realpath(this.config.legacy.pagesDir)]
          : []),
      ]);
      if (
        !isInside(realRoot, realCandidate) ||
        sourceRoots.some((root) => isInside(root, realCandidate))
      ) {
        throw assetError(route, "not a public static file");
      }
      const stat = await fs.promises.stat(realCandidate);
      if (existing !== candidate && stat.isDirectory()) return undefined;
      if (existing !== candidate || !stat.isFile())
        throw assetError(route, "not a public static file");
      return await fs.promises.readFile(realCandidate);
    } catch (error) {
      if (error instanceof MokabookError) throw error;
      throw assetError(route, errorMessage(error), error);
    }
  }
}

/** Stop at symlinks so dangling or escaping links cannot masquerade as deletions. */
async function closestExistingPath(candidate: string): Promise<string> {
  try {
    await fs.promises.lstat(candidate);
    return candidate;
  } catch (error) {
    const parent = path.dirname(candidate);
    if (
      (error as NodeJS.ErrnoException).code !== "ENOENT" ||
      parent === candidate
    )
      throw error;
    return closestExistingPath(parent);
  }
}

/** Confined Git implementation for base-commit Review assets. */
export class GitReviewAssetReader implements ReviewAssetReader {
  constructor(
    private readonly config: ResolvedConfig,
    private readonly git: GitClient,
    private readonly commit: string,
    private readonly mockupsPrefix: string,
  ) {}

  async read(route: string): Promise<Uint8Array> {
    const files = await this.readMany([route]);
    const content = files.get(route);
    if (!content) throw assetError(route, "Git batch omitted the file");
    return content;
  }

  /** Read and validate many base-snapshot assets in one bounded Git batch. */
  async readMany(
    routes: readonly string[],
  ): Promise<ReadonlyMap<string, Uint8Array>> {
    const requested = [...new Set(routes)].sort().map((route) => {
      assertPublicStaticRoute(route, this.config);
      return {
        repoPath:
          this.mockupsPrefix === "" ? route : `${this.mockupsPrefix}/${route}`,
        route,
      };
    });
    try {
      const repoPaths = requested.map(({ repoPath }) => repoPath);
      const gitFiles = this.git.readFiles
        ? await this.git.readFiles(this.commit, repoPaths)
        : await readGitFilesIndividually(this.git, this.commit, repoPaths);
      const files = new Map<string, Uint8Array>();
      for (const { repoPath, route } of requested) {
        const file = gitFiles.get(repoPath);
        if (!file || file.kind !== "regular") {
          throw assetError(
            route,
            `not a regular Git file (${file?.kind ?? "missing"})`,
          );
        }
        files.set(route, file.bytes);
      }
      return files;
    } catch (error) {
      if (error instanceof MokabookError && error.code === "review-invalid") {
        throw error;
      }
      throw assetError(
        requested[0]?.route ?? "base snapshot",
        errorMessage(error),
        error,
      );
    }
  }
}

/** Copy a pane and every transitively referenced local CSS/static dependency. */
export async function copySnapshotDependencies(
  files: Map<string, ReviewArtifactContent>,
  side: "after" | "before",
  seedRoutes: ReadonlySet<string>,
  read: (route: string) => Promise<ReviewArtifactContent>,
  readMany?: (
    routes: readonly string[],
  ) => Promise<ReadonlyMap<string, ReviewArtifactContent>>,
): Promise<void> {
  let queued = [...seedRoutes].sort();
  const seen = new Set<string>();
  while (queued.length > 0) {
    const batch = queued.filter((route) => !seen.has(route));
    for (const route of batch) seen.add(route);
    const missing = batch.filter(
      (route) => files.get(snapshotPath(side, route)) === undefined,
    );
    if (missing.length > 0) {
      const loaded = readMany
        ? await readMany(missing)
        : await readIndividually(missing, read);
      for (const route of missing) {
        const content = loaded.get(route);
        if (content === undefined) {
          throw assetError(route, "batch reader omitted the file");
        }
        addArtifactFile(files, snapshotPath(side, route), content);
      }
    }
    const discovered = new Set<string>();
    for (const route of batch) {
      const content = files.get(snapshotPath(side, route));
      if (content === undefined) {
        throw assetError(route, "snapshot dependency is unavailable");
      }
      for (const dependency of referencedRoutes(route, content)) {
        if (!seen.has(dependency)) discovered.add(dependency);
      }
    }
    queued = [...discovered].sort();
  }
}

async function readIndividually(
  routes: readonly string[],
  read: (route: string) => Promise<ReviewArtifactContent>,
): Promise<ReadonlyMap<string, ReviewArtifactContent>> {
  const files = new Map<string, ReviewArtifactContent>();
  for (const route of routes) files.set(route, await read(route));
  return files;
}

async function readGitFilesIndividually(
  git: GitClient,
  commit: string,
  repoPaths: readonly string[],
): Promise<ReadonlyMap<string, GitFile>> {
  const files = new Map<string, GitFile>();
  for (const repoPath of repoPaths) {
    const kind = await git.fileKind(commit, repoPath);
    files.set(
      repoPath,
      kind === "regular"
        ? { bytes: await git.readFileBytes(commit, repoPath), kind }
        : { kind },
    );
  }
  return files;
}

function assertPublicStaticRoute(
  route: string,
  config: ResolvedConfig,
): string {
  if (!isSafeRepositoryPath(route)) throw assetError(route, "unsafe path");
  const candidate = path.resolve(config.mockupsDir, route);
  if (
    !isInside(config.mockupsDir, candidate) ||
    isInside(config.entriesDir, candidate) ||
    Boolean(config.legacy && isInside(config.legacy.pagesDir, candidate))
  ) {
    throw assetError(route, "not a public static file");
  }
  return candidate;
}

function assetError(
  route: string,
  detail: string,
  cause?: unknown,
): MokabookError {
  return new MokabookError(
    "review-invalid",
    `could not retain Review asset ${route}: ${detail}`,
    cause === undefined ? undefined : { cause },
  );
}
