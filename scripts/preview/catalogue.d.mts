import type { ResolvedConfig } from "../../dist/config/types.js";
import type { PublicationOptions } from "../../dist/publication/options.js";

/** Capture a static catalogue inside the repository's owned preview boundary. */
export function buildPreview(
  config: ResolvedConfig,
  output: string,
  options?: PublicationOptions,
): Promise<void>;
