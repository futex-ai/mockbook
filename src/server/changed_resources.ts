/** Resource impact follows rendered references rather than source dependencies. */

import path from "node:path";

import { MokabookError } from "../errors.js";
import { referencedRoutes } from "../review/asset_references.js";
import type {
  OptionalReviewAssetReader,
  ReviewAssetReader,
} from "../review/assets.js";
import { normalizeReviewPair } from "../review/ignore.js";

/** Cache shared resource edges for one immutable changed-route calculation. */
export class ChangedResourceGraph {
  readonly #references = new Map<string, Promise<readonly string[]>>();

  constructor(
    private readonly reader: OptionalReviewAssetReader,
    private readonly baseline: ReviewAssetReader,
    private readonly changed: ReadonlySet<string>,
    private readonly documents: ReadonlyMap<string, string>,
  ) {}

  /** Inspect transitive local references, terminating even for cyclic imports. */
  async affects(source: string, document: string): Promise<boolean> {
    const pending = referencedRoutes(source, document, {
      resourceHints: false,
    });
    const seen = new Set<string>();
    let affected = false;
    for (let index = 0; index < pending.length; index += 1) {
      const route = pending[index];
      if (route === undefined || seen.has(route)) continue;
      seen.add(route);
      let references = this.#references.get(route);
      if (!references) {
        references = this.references(route);
        this.#references.set(route, references);
      }
      pending.push(...(await references));
      if (this.changed.has(route)) affected = true;
    }
    return affected;
  }

  private async references(route: string): Promise<readonly string[]> {
    let content = this.documents.get(route);
    if (content === undefined) {
      const bytes = await this.reader.readIfExists(route);
      if (bytes === undefined) {
        if (!this.changed.has(route))
          throw new MokabookError(
            "review-invalid",
            `referenced resource is missing: ${route}`,
          );
        await this.baseline.read(route);
        return [];
      }
      const extension = path.posix.extname(route).toLowerCase();
      if (![".css", ".html", ".htm"].includes(extension)) return [];
      content = Buffer.from(bytes).toString("utf8");
      if (extension !== ".css")
        content = normalizeReviewPair(content, content, route).head;
    }
    return referencedRoutes(route, content, { resourceHints: false });
  }
}
