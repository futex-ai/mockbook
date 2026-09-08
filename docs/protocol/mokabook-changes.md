# Changes and screen comparisons

The catalogue is Mokabook's only browsing surface. Its All / Changes filter
narrows the same navigation tree. There is no Review tab, launcher, report
section, or `mokabook review` command; `--out` is no longer a CLI option.

## Screen controls

Every structured screen offers Current / Side by side / Overlay / Difference
in a compact band beneath its heading. Current is selected initially, including
after navigation and reload. Selecting Changes, opening a screen, changing its
viewport or color scheme, and receiving a watched update do not generate
comparison snapshots. The first explicit diff selection requests the comparison.
Returning to Current cancels pending UI work and restores the current screen.
Navigation must never let a late comparison response replace another screen.

Diffs render inside the existing main region with the catalogue, title, details,
viewport, and scheme controls retained. Both viewports are supported. Snapshot
frames remain sandboxed without scripts or catalogue navigation privileges.
Overlay places the current snapshot at 50% opacity above its baseline;
Difference uses CSS difference blending. These are document comparisons, not
pixel measurements. They must never display invented pixel counts or percentages.
Missing before/after views remain explicit and legible in every mode.
Comparison frames retain matching dimensions; individual browser expansion is
available only in Current so it cannot misalign an overlay.

Loading, unavailable, and failed comparison states use plain product copy.
Failure offers a retry. Unchanged screens can still be compared from All.
Removed screens remain discoverable in Changes and show an explicit missing
current state until a comparison is requested. Dependency and ignored-region
evidence stays secondary to the screen preview.

## Generation and serving

The existing Git branch-point comparison engine, ownership checks, dependency
copying, ignored-region rules, and light/dark classifications remain in force.
The existing `review` configuration and authoring helpers are retained; the
configuration selects the Git base, internal snapshot directory, and shared
impact patterns. `serve --base` overrides the configured base.

The shell requests `/__mokabook/diffs/review.json` on demand. The response
redirects to an immutable generation; snapshot URLs resolve relative to that
response URL. No standalone HTML report or navigation payload is generated.
Only comparison JSON and snapshot files are served through this private route.
All responses disable caching. Refresh requests and watched invalidation reuse
the generation queue, retaining superseded snapshots briefly for in-flight
requests and draining active work before shutdown.

Static deployments retain All / Changes and normal screen browsing. Without a
comparison server they omit the diff controls, rather than shipping a dead link
or generating comparisons while publishing.

## Design references

The synthetic design catalogue owns distinct mobile and desktop examples at
`design/review/controls/current.html` and `design/review/controls/overlay.html`.
Existing outcome and impact examples now depict the same catalogue shell.
Their stable authoring ids and routes are retained to preserve links.

See [the shell design](./mokabook-shell-design.md) and
[runtime behavior](./mokabook-runtime.md) for the surrounding contracts.

## Comparison engine

An explicit screen diff request compares the workspace with a configured base ref, defaulting
to `origin/main`. It resolves the merge base shared by `HEAD` and that ref, then
reads the committed `mockupsDir` tree at that branch point without checking it
out or rebuilding it. Commits reachable only from the configured base do not
enter the comparison. Head artifacts come from the current working tree after
the same generated-output checks used by `mokabook check` succeed.
Review inspects only the requested base paths, grouping exact literal pathspecs
into count- and byte-bounded `ls-tree` operations, and reads regular-file blobs
through output-byte- and object-count-bounded `cat-file` batches. A single blob
that cannot fit the output budget fails explicitly after metadata inspection
and before a `cat-file` content process is spawned. The initial view document
set is one logical batch request; transitively referenced assets are grouped by
dependency depth. File modes are still checked before any blob is accepted, so
batching does not weaken symlink or non-regular-file rejection.

Screens pair by stable manifest route. Views pair by route, viewport, and color
scheme, enumerated from the union of base and head manifest entries. Each side's
view set is `["light", ...(screen.darkFragments ? ["dark"] : [])]`: a dark
view present only in head is `added`, and one present only in base is
`removed`. Mobile and desktop still classify separately from their fragments.
Added, removed, changed, and unchanged states handle version 2 and version 3
manifests during Accounting migration; pre-dark bases simply have no
`darkFragments`. Configured shared-impact globs and manifest dependencies
identify changes that can affect many screens. A dependency is a repository file
or directory root: its own change or any descendant change affects the entry,
and Review records the matching changed path as evidence. The configured comparison
directory, including its symlink-resolved in-repository target, is excluded before changed-path and shared-impact evidence
is calculated.

The private output contains `review.json`, `summary.md`, an ownership marker,
and the isolated snapshots. No HTML report or navigation payload is written.

Base and head panes live under separate route-preserving snapshot roots. Local
resources referenced by pane HTML or CSS are copied transitively, including
binary fonts and images, while explicit HTTP(S)/data resources remain external.
Root-absolute, protocol-relative, and other scheme-qualified resource URLs are
not portable in an isolated snapshot and fail comparison instead of being
silently omitted.
Current-worktree resources must resolve to regular public files. Every base
resource, including the pane document itself and each transitive dependency,
must be a regular Git file. Neither side may read from configured entry or
legacy source roots. Pane documents remain byte-unmodified and run in
script-disabled sandboxes.

`review.json` is the normative machine-readable result:

```ts
interface ReviewResult {
  schemaVersion: 2;
  baseRef: string;
  baseCommit: string; // merge base shared by HEAD and baseRef
  changedPaths: readonly string[];
  sharedImpact: readonly string[];
  ignoredImpact: readonly {
    id: string;
    viewport: "mobile" | "desktop";
    colorScheme: "light" | "dark";
    count: number;
  }[];
  screens: readonly {
    id: string;
    route: string;
    title: string;
    state: "added" | "removed" | "changed" | "ignored-only" | "unchanged";
    dependencies: readonly string[];
    sharedImpact: readonly string[];
    views: readonly {
      viewport: "mobile" | "desktop";
      colorScheme: "light" | "dark";
      state: "added" | "removed" | "changed" | "ignored-only" | "unchanged";
      beforePath?: string;
      afterPath?: string;
      ignoredIds: readonly string[];
    }[];
  }[];
}
```

Routes sort in deterministic catalogue order; views sort by viewport
(`mobile`, then `desktop`) and then color scheme (`light`, then `dark`).
Changed and impact paths sort lexically. No timestamp or absolute checkout path
enters the JSON. Before/after HTML remains unmodified in the artifact even when
ignore normalization changes classification.

## Review Ignore

`ReviewIgnore` marks repeated shell chrome with paired inert boundaries and no
layout wrapper. A stable kebab-case id is unique per generated document. Review
normalizes a region only when both sides contain one valid matching boundary.
One-sided adoption removes marker syntax but compares the real children.

Stateful repeated chrome supplies a deterministic material key derived from the
complete typed props used to render it. The signal remains outside the ignored
region and part of classification. One-sided material-signal adoption compares
real children. Malformed, duplicate, nested, overlapping, mismatched, or invalid
signals fail closed with route context.

Ignoring changes classification only. Stored fragments and compare panes keep
the real content. Ignored-only changes aggregate by id, viewport, and color
scheme instead of adding every consumer screen. Primary screen content must
never be ignored.
