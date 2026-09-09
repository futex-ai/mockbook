# Page Compatibility And Consumer Migration

## Delivery Status

Approved target, not implemented. This supplements
[Pages in the catalogue](./mokabook-pages.md). The current separate legacy
navigation remains implemented until the planned cutover is complete. The
change is a pre-1.0 breaking authoring/manifest change and needs release notes
and packed-consumer verification before publication.

## Existing Source Adapter

Retain generic `.source.ts`, `.source.tsx`, and `.source.html` rendering,
configured comment-component expansion, route aliases, exclusions, and lint
policies. Keep these under the existing `legacy` configuration as an input
adapter. Their origin does not become a runtime entry kind or hierarchy.

Extend that configuration with explicit registrations:

```ts
interface LegacyPageRegistration extends EntryInput {
  tags?: readonly string[];
}

interface LegacyConfig {
  // Existing fields, including pagesDir, remain supported.
  entries?: Readonly<Record<string, LegacyPageRegistration>>;
}
```

Keys are exact POSIX paths relative to `legacy.pagesDir`, including the source
extension; globs, traversal, absolute paths, and symlink escapes are invalid.
Metadata follows the normal page contract. A registration has no `route`,
`render`, or parent field: existing source-to-route/alias rules determine the
route, the adapter supplies rendering, and collections claim its ID through
`childIds`. Its attributed source and ownership header remain the original
source file. Dependency declarations retain their existing normalization.

Every discovered, non-excluded source must have exactly one registration;
every registration must resolve to a discovered, non-excluded source. Missing,
stale, duplicate-ID, or colliding-route registrations fail before rendering or
writing, with the source path and required action. Never silently hide a page,
invent its ID, choose a collection by title, or restore directory navigation.
An omitted `entries` field is valid only when no legacy sources are discovered.

The loader turns registered sources into page definitions before shared ID,
route, collection, and output validation. Sources render once through the
existing adapter; `.source.html` component expansion and legacy lint policies
still run. This is a single output owner and a single manifest entry, not a
second pass that emits `legacyPages`. A direct `definePage` and a registration
claiming the same source route fail rather than producing duplicate rows.

Consumers may instead import a document's existing `source()` function into
`definePage`. They must retire its automatic discovery/registration in the
same change, retain its applicable source-policy tests, and preserve its route
and anchors. Switching ownership from source to registry module must pass the
existing owned-output replacement checks. Do not erase source files or loosen
source-root, ownership, resource, or sandbox validation to achieve the migration.

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
contract. Keep all existing screen/base asset-copying, ignored-region, resource
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

Use compatibility registrations for this initial cutover so rendering and
ownership headers stay intact. Add their IDs to the owning collection modules,
not another App or Book collection. Payroll pages then appear beneath the real
App / Book / Payroll ancestry; header/selection appears within Transactions'
existing list collection. No package default may mention these IDs or routes.

Update Accounting's mockup README, protocol, exact-five-source policy, manifest
types, hierarchy/route tests, and source-policy checks. The invariant becomes
five registered document pages with the intended parents, no current
`legacyPages` inventory, and exactly the existing four root collections:
`app`, `email`, `marketing`, and `user-flows`. Product screens and user flows
keep their existing IDs, hierarchy, routes, and mobile/desktop output.

## Verification And Delivery Boundary

The Mokabook repository owns the API, adapters, schema/readers, shell, examples,
generic regression fixtures, packed consumers, and this migration guidance.
Accounting-owned registrations and source-policy changes belong in an
Accounting branch. A synced workspace is inspection input, not a substitute
for delivering a consumer commit to its owning repository.

Before the Mokabook feature branch is ready, pack the candidate and prove its
API, source adapter, mixed navigation, and migration against the existing
Accounting/Juno consumer fixtures. Also rehearse the five-page cutover in an
isolated disposable Accounting checkout using that exact tarball, without
modifying the inspected synced workspace or waiting for an npm release.
Archive the candidate identity, patch, inventory assertions, and verification
results under the task's ignored `.context` directory.

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
