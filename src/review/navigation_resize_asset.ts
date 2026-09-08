/** Loading of the bundled navigation resize client for Review artifacts. */

import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { MokabookError, errorMessage } from "../errors.js";

/** Artifact-root filename for the standalone navigation resize client. */
export const NAVIGATION_RESIZE_SCRIPT = "navigation-resize.js";

/** Read the package-owned classic script included in each Review artifact. */
export function loadNavigationResizeScript(): string {
  const candidate = fileURLToPath(
    new URL(`../client/${NAVIGATION_RESIZE_SCRIPT}`, import.meta.url),
  );
  try {
    return fs.readFileSync(candidate, "utf8");
  } catch (error) {
    throw new MokabookError(
      "review-invalid",
      `could not load navigation resize client: ${errorMessage(error)}`,
      { cause: error },
    );
  }
}
