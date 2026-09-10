import { minimatch } from "minimatch";

import { canonicalJson } from "../components/data.js";
import type { ComponentViewRecord } from "../components/manifest_types.js";
import { dependencyContainsChangedPath } from "../registry/dependency_paths.js";
import { analyzeHierarchy } from "../registry/hierarchy.js";
import type { Manifest, ManifestEntry } from "../registry/types.js";
import type {
  EntryChangeReason,
  ReviewEntryAddress,
} from "./component_types.js";

export type RoutedEntry = Exclude<ManifestEntry, { kind: "collection" }>;
export const address = (entry: RoutedEntry): ReviewEntryAddress => ({
  id: entry.id,
  route: entry.route,
  title: entry.title,
});
export const lexical = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;
export function entryPairs(
  before: Manifest,
  after: Manifest,
): { before: RoutedEntry | undefined; after: RoutedEntry | undefined }[] {
  const key = (entry: RoutedEntry) =>
    `${entry.kind}:${entry.kind === "component" ? entry.id : entry.route}`;
  const bases = new Map(
    before.entries.flatMap((entry) =>
      entry.kind === "collection" ? [] : [[key(entry), entry] as const],
    ),
  );
  const heads = new Map(
    after.entries.flatMap((entry) =>
      entry.kind === "collection" ? [] : [[key(entry), entry] as const],
    ),
  );
  return [...new Set([...bases.keys(), ...heads.keys()])]
    .sort()
    .map((id) => ({ before: bases.get(id), after: heads.get(id) }));
}
export function metadata(entry: RoutedEntry, manifest: Manifest): string {
  const ancestors = analyzeHierarchy<ManifestEntry>(manifest.entries)
    .hierarchy.ancestorsById.get(entry.id)
    ?.map(({ id, title }) => ({ id, title }));
  const {
    dependencies: _dependencies,
    declaredDependencies: _declaredDependencies,
    sourcePath: _source,
    navPath: _navPath,
    ...common
  } = entry;
  if (entry.kind === "component") {
    const { variants: _variants, ...component } = common as typeof entry;
    return canonicalJson({
      ...component,
      ancestors,
      variants: entry.variants.map(
        ({ componentViews: _views, ...variant }) => variant,
      ),
    });
  }
  if (entry.kind === "screen") {
    const { componentViews: _views, ...screen } = common as typeof entry;
    return canonicalJson({ ...screen, ancestors });
  }
  return canonicalJson({ ...common, ancestors });
}

/** Explicit owners override broad consumer declarations, retaining exact screen evidence. */
export class ComponentDependencyPolicy {
  private readonly entries: readonly ManifestEntry[];
  constructor(
    before: Manifest,
    after: Manifest,
    private readonly shared: readonly string[],
  ) {
    this.entries = [...before.entries, ...after.entries];
  }
  owners(changed: string): ReadonlySet<string> {
    return new Set(
      this.entries.flatMap((entry) =>
        entry.kind === "component" &&
        entry.ownedDependencies.some((root) =>
          dependencyContainsChangedPath(root, changed),
        )
          ? [entry.id]
          : [],
      ),
    );
  }
  independent(entry: RoutedEntry, changed: string): boolean {
    const owners = this.owners(changed);
    if (owners.has(entry.id) && entry.kind === "component") return true;
    const declared = entry.declaredDependencies ?? [];
    if (entry.kind === "screen" && declared.includes(changed)) return true;
    if (owners.size) return false;
    return (
      declared.some((root) => dependencyContainsChangedPath(root, changed)) ||
      this.shared.some((glob) => minimatch(changed, glob, { dot: true }))
    );
  }
  reasons(
    before: RoutedEntry | undefined,
    after: RoutedEntry | undefined,
    changed: readonly string[],
  ): EntryChangeReason[] {
    return changed
      .filter((item) =>
        [before, after].some((entry) => entry && this.independent(entry, item)),
      )
      .map((path) => ({ kind: "dependency", path }));
  }
  suppressResource(
    repoPath: string,
    publicPath: string,
    paired: ReadonlySet<string>,
    before?: ComponentViewRecord,
    after?: ComponentViewRecord,
    root?: string,
  ): boolean {
    if (!before || !after) return false;
    const owners = this.owners(repoPath);
    if (owners.size && [...owners].every((id) => id !== root && paired.has(id)))
      return true;
    const left = before.resources.find((item) => item.path === publicPath);
    const right = after.resources.find((item) => item.path === publicPath);
    return Boolean(
      left &&
      right &&
      canonicalJson(left.componentIds) === canonicalJson(right.componentIds) &&
      left.componentIds.every((id) => id !== root && paired.has(id)),
    );
  }
}
export function uniqueReasons(
  reasons: readonly EntryChangeReason[],
): EntryChangeReason[] {
  return [
    ...new Map(reasons.map((item) => [canonicalJson(item), item])).values(),
  ].sort(
    (a, b) =>
      lexical(a.kind, b.kind) ||
      lexical(
        "path" in a ? a.path : "route" in a ? a.route : "",
        "path" in b ? b.path : "route" in b ? b.route : "",
      ),
  );
}
