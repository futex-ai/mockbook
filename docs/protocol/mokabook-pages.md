# Pages In The Catalogue

## Delivery Status

Approved target, not implemented. The current package emits schema v3 and
builds separate structured and legacy navigation trees. This contract defines
their replacement; [page migration](./mokabook-page-migration.md) defines the
required consumer upgrade and historical comparison support. Current behavior remains documented in
[the package contract](./mokabook-package.md) and
[the runtime contract](./mokabook-runtime.md) until implementation lands.
Implementation is tracked in [Unified Catalogue Pages](../../plans/unified-catalogue-pages.md).

## Purpose And Boundary

Every browsable document belongs to the same catalogue as screens and use
cases. Collections own navigation through `childIds`; source directories,
route directories, and displayed titles never create or merge collections.
Whole-document rendering remains supported independently of navigation.

This is a breaking upgrade: remove legacy source discovery and configuration.
All pages use `definePage` or nested `page`; no source-registration adapter or
compatibility mode accepts the old authoring API. Consumers must update their
definitions/configuration and rebuild the catalogue before using the new version.

A page is one complete authored HTML document, such as a printable document
or an existing multi-state reference page. It does not require invented
mobile/desktop variants. Screens continue to own their real viewport and
color-scheme fragments; use-case steps continue to reference screens only.
This change adds no PDF parser, browser scripting privilege, or page comparison
engine. PDF-named Accounting mockups are HTML documents, not binary PDF input.

## Public Authoring

The root package exports `definePage`, nested `page`, and their public input
and definition types. The additional flat input is:

```ts
interface PageInput extends RoutedEntryInput {
  render: () => string;
  tags?: readonly string[];
}
```

`PageDefinition` adds `kind: "page"` and the same private definition brand and
module attribution as other definitions. Common metadata (`id`, `title`,
`description`, `dependencies`, `relatedDocs`, optional `rationale`) follows
`EntryInput`. Routes and IDs use the existing validation grammars. Page tags
use the existing optional, unique kebab-case tag contract.

```tsx
import { defineCollection, definePage } from "mokabook";
import { source } from "../documents/statement.source.js";

export const mockups = [
  defineCollection({
    id: "documents",
    title: "Documents",
    description: "Account documents.",
    childIds: ["account-statement"],
    relatedDocs: [],
    dependencies: [],
  }),
  definePage({
    id: "account-statement",
    title: "Account statement",
    description: "The printable account statement.",
    route: "documents/statement.html",
    render: source,
    relatedDocs: [],
    dependencies: ["documents/statement.source.tsx"],
  }),
];
```

The example assumes an existing `source(): string` export. A nested `page`
accepts the same metadata and callback, replaces `route` with `slug`, and
inherits only `dependencies` and `relatedDocs`. Its surrounding collections
contribute route segments and real membership, exactly as for nested screens.
It does not inherit screen addresses, tags, viewports, or color schemes.

Pages reject `mobile`, `desktop`, `colorSchemes`, `address`, `useCaseIds`,
`steps`, and `childIds`, including keys whose value is `undefined`. Untyped
JavaScript receives the same validation as typed authoring. A collection can
claim a page ID; a use-case `screenId` cannot name a page. Duplicate IDs,
multiple parents, missing children, duplicate child references, and collection
cycles retain their existing failures. Unclaimed pages are root leaves.

## Build And Output

The compiler calls each page callback once per compilation, synchronously,
after registry validation. Non-functions, promises, non-string return values,
throws, and incomplete HTML fail with the page ID and source location before
any output changes. Callbacks must be deterministic and return complete HTML;
they must not write output themselves.

A page generates exactly one file at `mockupsDir/<route>`. Its route is both
its logical catalogue destination and its artifact path. The screen renderer
does not wrap it, inject stylesheets, or generate extra variants. The consumer
continues to own the document's styles, responsive markup, and render context.
Pages are one light document regardless of the catalogue color-scheme setting.

Registry imports, page callbacks, imported document modules, and screen rendering
share the existing consumer bundle and React runtime.
Imported sources participate in watched rebuilds. Declared dependencies and
their directory descendants retain their existing impact semantics.

The complete output passes the shared child-control adapter, logical-link and
fragment validation, compatibility transformer, final metadata/ownership checks,
HTML/CSS/resource validation, and Review-ignore validation. The existing
transaction protects all output, including collision, orphan, rollback,
source-path, symlink, and foreign-file safeguards. Page routes cannot collide
with any other logical route or generated fragment. One owner may use its own
page route as its output; this is not treated as a self-collision.

Ownership headers identify the definition's registry module. Consumer migration
must explicitly regenerate old artifacts whose previous source is no longer an
authorized owner, as specified in the migration contract. Retain strict source
protection for imported render helpers and all overwrite safeguards. Generated
paths never imply collection ancestry.

## Manifest And Runtime Model

New builds write schema v4 at the existing `mokabook-manifest.json` filename:

```ts
interface ManifestPage extends ManifestEntryBase {
  kind: "page";
  route: string;
  tags?: readonly string[];
}

interface ManifestV4 {
  entries: readonly ManifestEntry[];
  generatedBy: "mokabook";
  schemaVersion: 4;
  sourceFiles: readonly string[];
}
```

`ManifestEntry` includes pages, screens, collections, and use cases, and its
base `kind` union includes `page`. All existing common fields remain,
including derived `navPath` compatibility output. Pages have no fragments,
viewport arrays, callbacks, or screen-only fields in the manifest. Schema v4
rejects a top-level `legacyPages` field. Preserve existing deterministic
entry sorting, dependency normalization, and serialization conventions.

`sourceFiles` is the sorted, unique inventory of repository-relative consumer
authoring modules from the shared bundle, including entries, the renderer,
and imported render helpers. It includes every entry's `sourcePath`; ordinary
CSS/font/image assets and external dependencies are not authoring modules.
Validate path confinement and forbid overlap with generated output. Current
serving and publishing use this persisted inventory to block source files even
when a migrated helper lives outside `entriesDir`; no legacy-root setting is
needed. A malformed or missing inventory invalidates a current v4 manifest.

Only the historical comparison reader may handle earlier shapes. Catalogue lookup,
the cached hierarchy, navigation, breadcrumbs, details, search, route targets,
and static publication consume one validated current entry model. Page leaves
use `entry:<id>`; collections retain `collection:<id>`. Remove runtime
directory-tree building, `legacy:` disclosure keys, route-derived Overview
folding, and the parallel legacy route-target/detail variants. A real Overview
page can be explicitly registered and named by its author.

Sibling titles may still match when their IDs differ. Do not merge, reparent,
rename, or hide entries merely because their labels match. This fixes invented
legacy groups without changing the existing independent-collection contract.

## Browse And Navigation

A page appears once under its declared collection, using the existing page
icon. The heading uses its title; breadcrumbs use its real collection ancestry;
the ID chip, search by ID/title/route/tags, tag picker, details, and home counts
include pages. Details show authored description, rationale, dependencies,
related docs, and the generated page path. No migration explanation or legacy
badge appears in a product view.

Reuse the complete-document frame, responsive shell, expansion control,
ownership authentication, and script-free sandbox. Do not add device chrome
around chrome already authored in the document. Hide controls implying screen
viewport variants, page color variants, or page comparisons; remember the
user's screen choices when navigating back to a screen. Mobile drawer and
desktop navigation show the same collection ownership.

`/view/<route>`, `/id/<id>`, and `/static/<route>` resolve a page with the
existing GET/HEAD behavior. `MockLink` and `mockLink` accept its ID. Their
portable target is its single generated file with the validated optional
anchor; Browse opens the canonical page and reveals its collection ancestors.
Page-to-screen logical links resolve to the desktop/light fragment; a page has
no per-viewport render context. Screen-to-page links target the same document
from every screen viewport and scheme. Use-case links still resolve through
their first screen.

Validate page anchors against the final single document, including after
compatibility transforms. Preserve the existing fragment grammar, duplicate
query rejection, invalid-anchor behavior, safe URL handling, link-owner
authentication, and exclusion of unowned public HTML. Served and published
pages must handle direct URLs, in-frame navigation, Back/Forward, and fragment
restoration identically. Old portable artifact links remain valid.

## Changes, Watch, And Publishing

Pages participate in the All/Changes filter. Compare stable page metadata,
real ancestor IDs/titles, the generated document, explicitly declared
dependencies, and shared-impact paths against the Git branch point. Renaming
or reparenting a page affects its route; moving unrelated source composition
without changing those inputs does not mark every page in that module changed.
Do not use the serialized `navPath` as independent impact evidence.

Screen comparison generation and use-case impact propagation retain their
screen-only boundary. Adding page support must not make those paths assume
every non-collection/non-use-case entry has screen fragments. Pages expose
Current only; they do not trigger snapshot generation or fabricate comparisons.
Removed v4 pages remain discoverable in Changes with their baseline metadata
and an explicit missing-current state, following current removed-screen route
precedence. No additional collection tree is synthesized for removed pages.

Watch rebuilds imported sources, recomputes page impact before notification,
and restores disclosures by entry/collection identity. Parent changes update
both navigation and breadcrumbs after reload. Existing saved `collection:`
keys survive; old `legacy:` keys are ignored, never applied to a collection
with the same title. Active ancestors open through the existing reveal logic.

Static publishing includes each page route, generated document and resources,
ID redirect, validated anchor navigation, metadata, search/filter behavior,
and removed-v4-page state. It performs no page comparison generation. Preserve
transactional publication and existing screen comparison artifacts.

## Acceptance

Authoring, schema, build, links, server, browser, watcher, comparison-regression,
and packed-consumer tests cover normal pages and mandatory consumer migration,
including obsolete-config rejection and safe old-artifact regeneration.
Use a mixed collection containing a screen, page, and use case; an unclaimed
page; distinct same-title collections; and a document whose route disagrees
with its collection ancestry. Verify output determinism and every existing
screen safety boundary. The five-page Accounting inventory and release
acceptance are fixed in [the migration contract](./mokabook-page-migration.md).
