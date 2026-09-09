/** Resource impact follows rendered references rather than source dependencies. */

import path from "node:path";

import { referencedRoutes } from "../review/asset_references.js";
import type { ReviewAssetReader } from "../review/assets.js";
import { normalizeReviewPair } from "../review/ignore.js";

/** Cache shared resource edges for one immutable changed-route calculation. */
export class ChangedResourceGraph {
  readonly #references = new Map<string, Promise<readonly string[]>>();

  constructor(
    private readonly reader: ReviewAssetReader,
    private readonly changed: ReadonlySet<string>,
    private readonly documents: ReadonlyMap<string, string>,
  ) {}

  /** Inspect transitive local references, terminating even for cyclic imports. */
  async affects(source: string, document: string): Promise<boolean> {
    const pending = referencedRoutes(source, document, {
      resourceHints: false,
    });
    const seen = new Set<string>();
    for (let index = 0; index < pending.length; index += 1) {
      const route = pending[index];
      if (route === undefined || seen.has(route)) continue;
      if (this.changed.has(route)) return true;
      seen.add(route);
      const extension = path.posix.extname(route).toLowerCase();
      if (![".css", ".html", ".htm"].includes(extension)) continue;
      let references = this.#references.get(route);
      if (!references) {
        references = this.references(route, extension);
        this.#references.set(route, references);
      }
      pending.push(...(await references));
    }
    return false;
  }

  private async references(
    route: string,
    extension: string,
  ): Promise<readonly string[]> {
    let content = this.documents.get(route);
    if (content === undefined) {
      content = Buffer.from(await this.reader.read(route)).toString("utf8");
      if (extension !== ".css")
        content = normalizeReviewPair(content, content, route).head;
    }
    return referencedRoutes(route, content, { resourceHints: false });
  }
}
