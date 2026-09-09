/** Shared traversal of portable local resource references. */

/** Resource edges supplied by a caller's validation and normalization policy. */
export interface ResourceReferenceReader {
  readReferences(route: string): Promise<readonly string[]>;
}

/** Cache shared edges while visiting every reachable resource, including cycles. */
export class ResourceGraph {
  readonly #references = new Map<string, Promise<readonly string[]>>();

  constructor(private readonly reader: ResourceReferenceReader) {}

  async collect(seeds: readonly string[]): Promise<ReadonlySet<string>> {
    const pending = [...seeds];
    const seen = new Set<string>();
    for (let index = 0; index < pending.length; index += 1) {
      const route = pending[index];
      if (route === undefined || seen.has(route)) continue;
      seen.add(route);
      let references = this.#references.get(route);
      if (!references) {
        references = this.reader.readReferences(route);
        this.#references.set(route, references);
      }
      pending.push(...(await references));
    }
    return seen;
  }
}
