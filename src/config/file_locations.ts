import fs from "node:fs";
import path from "node:path";

import { isInside, projectRealPath, toPosixPath } from "./paths.js";

/** Logical and canonical identities confined to the same configured root. */
export interface FileLocation {
  readonly logicalPath: string;
  readonly physicalPath: string;
  readonly relativePath: string;
  readonly physicalRelativePath: string;
}

/** Locate existing or missing paths without accepting escaping or dangling links. */
export function locatePath(
  candidate: string,
  root: string,
  repoRoot = root,
): FileLocation | undefined {
  try {
    const logicalPath = path.resolve(candidate);
    if (!isInside(repoRoot, root) || !isInside(root, logicalPath)) return;
    const realRepo = fs.realpathSync(repoRoot);
    const realRoot = fs.realpathSync(root);
    const physicalPath = projectRealPath(logicalPath);
    if (!isInside(realRepo, realRoot) || !isInside(realRoot, physicalPath))
      return;
    return {
      logicalPath,
      physicalPath,
      relativePath: toPosixPath(path.relative(root, logicalPath)),
      physicalRelativePath: toPosixPath(path.relative(realRoot, physicalPath)),
    };
  } catch {
    return;
  }
}
