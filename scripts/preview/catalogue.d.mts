import type { ResolvedConfig } from "../../dist/config/types.js";
import type { PublicationOptions } from "../../dist/publication/options.js";

/** Capture already-built output; callers must build/check before publication. */
export function buildPreview(
  config: ResolvedConfig,
  output: string,
  options?: PublicationOptions,
): Promise<void>;
