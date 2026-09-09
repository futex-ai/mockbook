# Optional Changes In Published Catalogues

## Delivery Status

Approved target, not implemented. The current repository preview builder always
includes Git changes and screen comparisons, as documented in
[Changes](./mokabook-changes.md) and [preview deployments](./npm-release.md).
This contract makes that content optional; implementation is tracked in
[Optional Published Changes](../../plans/optional-published-changes.md).

The option applies to the whole catalogue. It can ship independently of
[first-class pages](./mokabook-pages.md); each implementation consumes the
current supported manifest and entry kinds. It does not retain obsolete
authoring APIs or alter the mandatory page migration.

## Publication Option

Extend the existing repository-only preview builder with these commands:

```bash
npm run preview:build
npm run preview:build -- --include-changes
npm run preview:build -- --include-changes --base origin/main
```

These are target commands, not yet available. Keep the existing `--out <path>`
option, output default, and ownership restrictions. Accept options in any order;
reject unknown or repeated options, missing values, and `--base` without
`--include-changes` before loading consumer code or changing output.

The internal `buildPreview(config, output, options)` boundary receives:

```ts
type PublicationOptions =
  | { includeChanges?: false; base?: never }
  | { includeChanges: true; base?: string };
```

Omitting options is equivalent to `{ includeChanges: false }`. Validate the
same contract for JavaScript callers. With changes enabled, `base` overrides
`config.review.base`, whose existing default is `origin/main`. Git availability,
branch names, and an existing review configuration never enable the option
implicitly. This extends the repository script, not the npm package CLI.

## Current Catalogue By Default

Publish the current home, catalogue routes, resources, metadata, search, tags,
collection hierarchy, ID redirects, and not-found page. Preserve screen
viewport/color selection and page rendering.

Omit All/Changes controls and counts, screen comparison controls, removed-entry
rows/routes/redirects, comparison JSON, and baseline snapshots/resources. Do not
resolve Git history, compute changes, read historical manifests, or initialize
a comparison provider. Publication must succeed from a valid source archive
without `.git` or a configured base ref.

Pass an explicit publication capability to the capture server and shell so
their development defaults cannot re-enable review. Stored preferences and
direct links requesting Changes or a comparison fall back to All/Current while
preserving the valid route, viewport, color scheme, and fragment. Comparison
endpoints return the ordinary not-found response and never generate output.
The browser sends no change/comparison requests.

In both publication options, strip the watched-server live-update entrypoint
from every captured shell page and omit its watch-only assets. Keep the browser
modules needed for ordinary navigation and optional comparison controls. Never
start an EventSource, poll for development updates, or publish/redirect an
`/__mokabook/events` endpoint. On static hosting that URL has the ordinary
not-found response. This preserves the existing static-export invariant, also
for home, missing-route, and removed-entry pages.

Existing generated comparison directories, including configured review output,
must stay excluded from public asset copying. Building over a previous export
with comparisons replaces the complete owned artifact transactionally, removing
obsolete review files and redirects; never leave them reachable through a
previous generation or stale asset copy.

## Explicitly Include Changes

With `--include-changes`, publish the existing All/Changes navigation and screen
comparison controls, including a zero changed count. Retain removed-screen
metadata, routes, and comparisons under the existing ID/route precedence rules.
Once page support lands, include page impact and removed-v4-page missing-current
states from the [shared catalogue snapshot](./mokabook-catalogue-changes.md),
including flat Changes rows after deleting their parents. Pages still have no
visual comparisons. Until that target lands, preserve current screen metadata.

Resolve the effective base and HEAD once, then pin their merge-base commit for
both route impact and screen comparisons. Capture the current catalogue,
generated documents, and resources consistently for that build; fail if inputs
change during capture rather than mix revisions. Record the resolved comparison
baseline with the exported review metadata. The artifact represents the files
captured at publication time, including any permitted uncommitted input, rather
than claiming that HEAD alone identifies those bytes.

Package validated comparison data and isolated resources under the existing
immutable generation path. Browser diff selection loads the packaged result;
refresh/retry uses that same result. Later Git commits or changes to the base
ref do not update a published artifact. Only a new publication replaces it.

An unavailable base, invalid historical manifest, capture inconsistency, or
comparison failure aborts publication and preserves the previous owned output.
Do not silently fall back to a catalogue without changes when they were
explicitly requested. Preserve source protection, snapshot isolation, resource
confinement, and sandbox restrictions in both options.
After the v4 cutover, both options apply the
[shared source policy](./mokabook-source-protection.md), including unimported
reserved files and complete config/consumer input inventories.

## Workflows And Presentation

The existing `main` preview job uses the default command. The PR preview job
explicitly passes `--include-changes --base origin/main`, retaining its current
review purpose and full-history checkout. Deployment aliases, credentials,
ownership checks, cleanup, and npm publication remain unchanged.

The option is selected at build time. A visitor cannot toggle omitted review
data on. Local development keeps its existing Git-aware Changes and on-demand
comparison behavior. Reuse the same shell components, enabling controls from
the explicit capability rather than an environment label or separate shell.
Before UI implementation, add mobile and desktop mockups of the current
catalogue with review omitted and the same catalogue with review included.

## Acceptance

Test default and explicit options through the script and internal boundary,
including invalid arguments and configured/default/overridden bases. Prove
default publication performs no Git/review calls and works without history.
Opt existing comparison tests and PR workflow fixtures in explicitly.

Test archive inputs, removed-entry absence, excluded stale comparison assets,
review-to-default replacement, rollback, unavailable/advancing bases, input
changes during capture, and frozen comparisons after publication. Browser tests
cover controls, persisted preferences, direct links, search/tags, anchors,
Back/Forward, zero-change review, and no comparison network requests by default
at mobile and desktop widths. Preserve existing comparison and safety tests.
Parameterize static-export tests over both options: no live-update entrypoint,
no EventSource or polling request, and no events endpoint or redirect. Test
home, current, not-found, and supported removed-entry routes while proving
normal navigation and opted-in comparison loading still work.
