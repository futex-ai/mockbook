/** Resource impact follows rendered references rather than source dependencies. */

import path from "node:path";

import { MokabookError } from "../errors.js";
import { referencedRoutes } from "../review/asset_references.js";
import type {
  OptionalReviewAssetReader,
  ReviewAssetReader,
} from "../review/assets.js";
import { normalizeReviewPair } from "../review/ignore.js";
import { ResourceGraph } from "../review/resource_graph.js";

/** Cache shared resource edges for one immutable changed-route calculation. */
export class ChangedResourceGraph {
  readonly #graph = new ResourceGraph({
    readReferences: (route) => this.references(route),
  });

  constructor(
    private readonly reader: OptionalReviewAssetReader,
    private readonly baseline: ReviewAssetReader,
    private readonly changed: ReadonlySet<string>,
    private readonly documents: ReadonlyMap<string, string>,
  ) {}

  /** Inspect transitive local references, terminating even for cyclic imports. */
  async affects(source: string, document: string): Promise<boolean> {
    const seeds = referencedRoutes(source, document, {
      resourceHints: false,
    });
    const resources = await this.#graph.collect(seeds);
    return [...resources].some((route) => this.changed.has(route));
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
