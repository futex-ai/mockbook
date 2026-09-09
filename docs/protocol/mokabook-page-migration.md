# Breaking Page Migration

## Delivery Status

Approved target, not implemented. This supplements
[Pages in the catalogue](./mokabook-pages.md). The current separate legacy
navigation remains implemented until the planned cutover is complete. The
change is a pre-1.0 breaking authoring/manifest change and needs release notes
and packed-consumer verification before publication.

## Required Upgrade

Remove the `legacy` configuration and its discovery/rendering API, including
`pagesDir`, comment-component expansion, route aliases, exclusions, and legacy
lint settings. Do not implement `legacy.entries`, a registration adapter,
automatic conversion, an opt-out flag, or a deprecation period. Configuration
validation rejects the obsolete `legacy` key, even when set to `undefined`,
before bundling or writing and directs the author to `definePage` and this
migration procedure.

Every whole-document page must be a `definePage` or nested `page` entry under
`entriesDir`, with an explicit ID, route or slug, render callback, and metadata.
Collections own its membership. Existing `.source.ts`/`.source.tsx` modules may
remain as ordinary imported render helpers; their filename has no discovery
meaning. The compiler never scans them into a second inventory. Consumers with
only structured entries need no screen API rewrite but must rebuild v4 output.

Consumers replace `.source.html` comment templates with ordinary TSX/function
composition returning complete HTML. Preserve the rendered component content
and portable links. Translate each route alias into the new page's explicit
`route`, and retain screen-count, stage-ID, allowlist, and source-content
requirements as consumer source-policy tests. Shared package HTML, resource,
link, metadata, ownership, and sandbox checks continue to apply to all pages.

Only historical manifest parsing remains for old Git comparisons, as defined
below. The existing unrelated document-transformer API retains its contract;
it cannot accept obsolete `legacy` configuration or restore legacy discovery.

## Consumer Migration And Output Ownership

Before changing the dependency or config, record the old manifest, generated
page bytes, source/route inventory, anchors, and resources in a clean, recoverable
checkout. Add a normal page definition for every retained document and claim
its ID from the intended collection. Import its existing `source()` callback
where possible, with the source in its declared dependencies. Remove `legacy`
configuration and replace consumer rules that depend on its discovery model.

New page ownership headers name the registry module beneath `entriesDir`.
An old page header can name a helper beneath the removed `legacy.pagesDir`,
which is no longer an authorized output owner. The upgraded writer must
continue refusing that overwrite; do not add a permissive owner fallback or a
permanent legacy root to make rebuilding succeed.

During the consumer migration, verify each old generated page against the
saved validated manifest and old config: exact route and source/header match,
regular file, in-root path, no symlink escape, and no authored-source collision.
Archive its bytes, then remove only those verified generated files before
rebuilding at the same routes. This is a consumer migration step, not an
automatic runtime cleanup command. Unowned or mismatched files require manual
resolution and must not be deleted. Never remove source files, static assets,
whole output directories, or generated files outside the recorded inventory.

On failure, restore the previous dependency/config, authoring tree, and artifacts;
do not commit a half-migrated catalogue. On success, compare old and new route,
anchor, resource, and rendered-content inventories and commit the regenerated
pages with the new ownership headers and v4 manifest. A missing document is a
migration failure even when the remaining catalogue builds successfully.

Imported render-source modules must remain protected from static serving after
the old source-root configuration is removed. Track those modules in the shared
authoring graph, manifest `sourceFiles`, and watcher; do not expose them as public HTML or TypeScript
assets merely because their directory is no longer configured as legacy.

## Manifest Readers And Git Baselines

New successful builds emit only schema v4. `check` recomputes that output
without rewriting files and reports a committed v3 manifest as stale. A
current Browse or publication reader requires v4; encountering v2/v3 reports
that the catalogue must be migrated and rebuilt before serving. Watched Serve
retains its last-good child if a candidate migration fails validation.

Historical v3 manifests remain valid Git baselines; v2 keeps its existing
`compatibility.readManifestV2` opt-in and filename fallback. A present malformed
canonical manifest never falls back to the older filename. Build a dedicated,
typed historical reader so current-v4 validation cannot reject an otherwise
valid screen comparison against a v2/v3 base or silently accept legacy current
navigation. Parse and validate historical source/route/artifact fields before
using them; never rewrite the Git baseline or synthesize a current legacy tree.

Match a historical legacy page to a current page by its exact preserved route,
whose uniqueness has been validated. Use the historical document/source for
artifact comparison and the current ID for attribution. This is a comparison
adapter only: it cannot assign a current collection or change a current title.
New explicit metadata/ancestry can mark migration routes changed; there is no
promise of a zero Changes count during adoption. A changed historical route
without an explicit preserved match is treated as an added current page.

Unmatched v2/v3 legacy records have no catalogue IDs and remain historical
artifact records; they never become synthetic removed-page entries. Normal v4
page removals have real IDs and use the missing-current behavior in the page
contract wherever Changes is enabled. Ordinary publication omits removed pages;
the [publication option](./mokabook-publication.md) explicitly enables review.
Keep all existing screen/base asset-copying, ignored-region, resource
confinement, cancellation, and publication safeguards through schema changes.

## Accounting Inventory

The inspected `accounting/tallinn-v3` manifest contains exactly one `app`
collection with nine children. Its five intentional legacy HTML documents
produce a separate `app/book` directory tree today. Preserve every document,
generated route, anchor, resource, and user-facing link during registration.
No payroll or transactions product screen is replaced by this migration.

All source paths below are relative to `docs/mockups/src/pages/`:

| Existing source suffix                                                 | New page ID                         | Owning collection ID      |
| ---------------------------------------------------------------------- | ----------------------------------- | ------------------------- |
| `app/book/payroll/payroll-p11d-pdf.source.tsx`                         | `payroll-document-p11d`             | `payroll-pages`           |
| `app/book/payroll/payroll-p45-pdf.source.tsx`                          | `payroll-document-p45`              | `payroll-pages`           |
| `app/book/payroll/payroll-p60-pdf.source.tsx`                          | `payroll-document-p60`              | `payroll-pages`           |
| `app/book/payroll/payroll-payslip-pdf.source.tsx`                      | `payroll-document-payslip`          | `payroll-pages`           |
| `app/book/transactions/transactions-list/header-and-select.source.tsx` | `transactions-header-and-selection` | `transactions-list-pages` |

These IDs were unused in the inspected manifest. Recheck them at implementation
time and fail on collisions rather than renaming any existing entry. Use titles
`P11D`, `P45`, `P60`, `Payslip`, and `Header and selection`, with authored
descriptions, dependencies, and related docs from the owning source/spec.
Each `.source.tsx` suffix still generates its existing `.html` route.

Create ordinary `definePage` entries importing the five existing `source()`
functions, with their existing generated routes written explicitly. Perform
the verified output-ownership migration above. Add their IDs to the owning
collection modules, not another App or Book collection. Payroll pages then appear beneath the real
App / Book / Payroll ancestry; header/selection appears within Transactions'
existing list collection. No package default may mention these IDs or routes.

Update Accounting's mockup README, protocol, exact-five-source policy, manifest
types, hierarchy/route tests, and source-policy checks. The invariant becomes
five registered document pages with the intended parents, no current
`legacyPages` inventory, and exactly the existing four root collections:
`app`, `email`, `marketing`, and `user-flows`. Product screens and user flows
keep their existing IDs, hierarchy, routes, and mobile/desktop output.

## Verification And Delivery Boundary

The Mokabook repository owns the API, schema/readers, shell, examples,
generic regression fixtures, packed consumers, and this migration guidance.
Accounting-owned page definitions and source-policy changes belong in an
Accounting branch. A synced workspace is inspection input, not a substitute
for delivering a consumer commit to its owning repository.

Before the Mokabook feature branch is ready, pack the candidate and prove its
API, obsolete-config rejection, mixed navigation, and migration against the existing
Accounting/Juno consumer fixtures. Also rehearse the five-page cutover in an
isolated disposable Accounting checkout using that exact tarball, without
modifying the inspected synced workspace or waiting for an npm release.
Archive the candidate identity, patch, inventory assertions, and verification
results under the task's ignored `.context` directory.

The implementation commit and release notes must identify the removal of the
legacy authoring/discovery API as a breaking change, with upgrade instructions.
Use the repository's Conventional Commits breaking-change notation and release
workflow. Do not publish a release that implies unchanged consumer compatibility.

The Accounting rehearsal must run `mockups:build`, `mockups:check`,
`mockups:test`, `mockups:typecheck`, relevant browser tests, and its required
repository check. Start Browse and visually inspect all five pages and their
incoming links on mobile and desktop, then verify direct artifact URLs,
anchors, search, breadcrumbs, and exactly one App group. Compare pre/post
inventories so a missing page cannot make the count assertion pass.

Durable Accounting adoption is a coordinated consumer change after an
available package version is selected; actual npm publication and deployment
are outside this plan's implementation gate. Record that follow-up separately,
including its commit/push/review and generated output requirements. Do not
claim that the user's existing catalogue has been fixed merely because the
Mokabook package or the disposable rehearsal passed.
