import { isSafeRepositoryPath } from "../config/paths.js";
import type { ReviewArtifactContent } from "../review/types.js";
import { exportError } from "./error.js";

/** A single collision-checked namespace for every deployed file. */
export class ExportInventory {
  readonly files = new Map<string, ReviewArtifactContent>();
  readonly #names = new Map<string, string>();

  /** Add a safe file, permitting only byte-identical exact-path duplicates. */
  add(name: string, content: ReviewArtifactContent): void {
    if (!isSafeRepositoryPath(name))
      throw exportError(`Unsafe export path: ${name}`);
    const folded = name.toLowerCase();
    for (const [existing, original] of this.#names) {
      if (existing === folded) {
        const previous = this.files.get(original);
        if (
          original === name &&
          previous !== undefined &&
          Buffer.from(previous).equals(Buffer.from(content))
        )
          return;
        throw exportError(`Export path collision: ${name} and ${original}`);
      }
      if (
        existing.startsWith(`${folded}/`) ||
        folded.startsWith(`${existing}/`)
      )
        throw exportError(
          `Export file/directory collision: ${name} and ${original}`,
        );
    }
    this.#names.set(folded, name);
    this.files.set(name, content);
  }
}
