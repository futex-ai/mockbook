import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Metafile } from "esbuild";

import type { ResolvedConfig, ModuleLoader } from "../config/types.js";
import {
  isInside,
  isSafeRepositoryPath,
  projectRealPath,
  toPosixPath,
} from "../config/paths.js";
import { MokabookError } from "../errors.js";

/** Names reserved for authoring, including stale helpers no longer imported. */
export function isReservedSource(candidate: string): boolean {
  return /\.source\.(?:html?|[cm]?[jt]sx?)$/i.test(candidate);
}

interface SourceIndex {
  inventory: readonly string[] | undefined;
  files: Set<string>;
  aliases: string[];
}
const sourceIndexes = new WeakMap<ResolvedConfig, SourceIndex>();

/** One shared classifier for build, serve, export and resource resolution. */
export function isAuthoringSource(
  candidate: string,
  config: ResolvedConfig,
): boolean {
  const real = projectRealPath(candidate);
  if (
    isInside(config.entriesDir, candidate) ||
    isInside(fs.realpathSync(config.entriesDir), real) ||
    isReservedSource(candidate) ||
    isReservedSource(real)
  )
    return true;
  let index = sourceIndexes.get(config);
  if (!index || index.inventory !== config.sourceFiles) {
    const files = new Set<string>();
    const aliases: string[] = [];
    for (const source of config.sourceFiles ?? []) {
      const logical = path.resolve(config.repoRoot, source);
      const physical = projectRealPath(logical);
      files.add(logical);
      files.add(physical);
      if (logical !== physical) aliases.push(logical);
    }
    index = { inventory: config.sourceFiles, files, aliases };
    sourceIndexes.set(config, index);
  }
  return (
    index.files.has(candidate) ||
    index.files.has(real) ||
    index.aliases.some((alias) => projectRealPath(alias) === real)
  );
}

/** Record actual graph inputs before tree shaking, including both path aliases. */
export function graphSourceFiles(
  metafile: Metafile,
  workingDir: string,
  repoRoot: string,
  loaders: Readonly<Record<string, ModuleLoader>> = {},
): string[] {
  const runtime = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
  const candidates = Object.keys(metafile.inputs).flatMap((input) => {
    const absolute = path.resolve(workingDir, input);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return [];
    const real = fs.realpathSync(absolute);
    if (isInside(runtime, real)) return [];
    const extension = path.extname(absolute).toLowerCase();
    const loader = loaders[extension];
    const publicAsset =
      ["file", "dataurl", "base64", "binary", "css", "empty"].includes(
        loader ?? "",
      ) ||
      (loader === undefined &&
        /\.(?:css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf)$/i.test(absolute));
    if (publicAsset && !isReservedSource(absolute)) return [];
    if (real.split(path.sep).includes("node_modules")) return [];
    return [absolute];
  });
  return normalizeSourceFiles(candidates, repoRoot);
}

/** Prove regular in-repository inputs and retain logical and physical identities. */
export function normalizeSourceFiles(
  files: readonly string[],
  repoRoot: string,
): string[] {
  const realRoot = fs.realpathSync(repoRoot);
  const inventory = new Set<string>();
  for (const file of files) {
    const absolute = path.resolve(repoRoot, file);
    const real = fs.realpathSync(absolute);
    if (
      !isInside(repoRoot, absolute) ||
      !isInside(realRoot, real) ||
      !fs.statSync(real).isFile()
    )
      throw new MokabookError(
        "build-invalid",
        `authoring input must be a regular file inside repoRoot: ${file}`,
      );
    for (const relative of [
      toPosixPath(path.relative(repoRoot, absolute)),
      toPosixPath(path.relative(realRoot, real)),
    ]) {
      if (!isSafeRepositoryPath(relative))
        throw new MokabookError(
          "build-invalid",
          `invalid source input: ${relative}`,
        );
      inventory.add(relative);
    }
  }
  return [...inventory].sort();
}
