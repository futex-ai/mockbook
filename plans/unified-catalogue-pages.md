# Unified Catalogue Pages

## Status And Outcome

Plan updated for a mandatory breaking upgrade; implementation has not started.
The plan remains active.
The user approved planning after inspection of Accounting's `tallinn-v3`
catalogue confirmed that five intentional document pages create a second App
root beside its one real App collection.

Deliver first-class whole-document pages with explicit IDs and ordinary
collection membership. Preserve existing document rendering, routes, anchors,
and resources, and make navigation, breadcrumbs, links, search, Changes, and
publication consume one hierarchy. Do not merge collections by display name.

## Contracts And Scope

- [Pages in the catalogue](../docs/protocol/mokabook-pages.md) owns the API,
  schema-v4 entry model, output, Browse, links, impact, and publication contract.
- [Breaking page migration](../docs/protocol/mokabook-page-migration.md)
  owns required consumer updates, safe output regeneration, historical readers, the five Accounting
  mappings, and consumer delivery boundaries.
- [Shell design](../docs/protocol/mokabook-shell-design.md) owns reusable design
  components and responsive presentation. Its example catalogue is the
  established Mokabook mockup source of truth.

This plan covers Mokabook implementation, generic packed-consumer fixtures, and
a pre-release Accounting rehearsal using the candidate package. It does not
publish npm, deploy a site, or silently modify the synced Accounting checkout.
Durable Accounting adoption is the separate consumer follow-up below.

Keep complete-document rendering through `definePage` and nested `page` only.
Remove `legacy` configuration, automatic source discovery, and its rendering
adapter; do not add `legacy.entries` or a compatibility mode. Consumers import
existing render helpers into normal entries, preserve explicit routes, and
rebuild one v4 manifest without `legacyPages`. v2/v3 remain readable only at the
historical comparison boundary. Whole-document comparisons and page-valued
use-case steps are outside this change; pages use Current and participate in
Changes as specified.

[Optional Published Changes](./optional-published-changes.md) independently owns
the publication opt-in and workflow defaults. Integrate pages with that
[contract](../docs/protocol/mokabook-publication.md): ordinary publication shows
current entries; review publication additionally includes Changes and removals.
Complete that option before page publication acceptance; page authoring/compiler
work can proceed independently.

## Working Rules

Each milestone must leave the existing product and its applicable checks
functional. Complete mockups before UI changes. Prepare backend readers and
page support before switching consumers to v4; do not activate a breaking cutover
while any active compiler, server, publisher, or fixture still expects only v3.
Update affected fixtures with the API changes instead of preserving a parallel
legacy authoring path. No environment or migration flags appear in product views.

Add regression tests before changing each failing behavior. Preserve unrelated
mainline features and all five Accounting documents. Recheck source inventory
and IDs when implementation starts; the inspected remote sync may advance.
New tasks go into the relevant unfinished milestone. Backend gaps discovered
during a tagged milestone require a new backend milestone immediately after
it, followed by a new tagged milestone containing the blocked tasks.

## Milestone 1: Establish the target contract — completed

Define the complete target before scheduling implementation, and keep current
shipping behavior distinguishable from the approved future contract.

- [x] Inspect the duplicate roots, source registrations, catalogue types,
      collection ownership, build pipeline, links, baseline readers, and shell.
- [x] Write the page and migration protocols with explicit delivery status,
      compatibility failures, security boundaries, and acceptance requirements.
- [x] Cross-link the target from the existing protocol documents and README.
- [x] Create this plan and add it to the active plans index.

The documentation defines the implementation; no page API or UI change ships
in this planning commit. Validate Markdown and links and review the diff for
this documentation-only change; the repository exempts it from `xtask check`.
Commit/push the planning documents and run the required post-push review.
The implementation delivery gate is the final milestone below.

Planning validation: Prettier, all 82 local link targets in the changed
Markdown, milestone/tag/index structure, document lengths, and whitespace
checks passed. `cargo xtask check` is exempt for this documentation-only
snapshot. The initial planning snapshot was committed and pushed as `9370a26`;
its post-push review found no actionable issues.

## Milestone 2: Require a breaking consumer upgrade — completed

The user accepted forcing consumers to update. Simplify the target before
implementation by removing the proposed source-registration compatibility layer.

- [x] Require normal page definitions and reject the obsolete `legacy` config;
      retain historical readers solely for comparisons with old Git baselines.
- [x] Specify source-preserving consumer updates, guarded artifact regeneration,
      and release notes identifying the intentional breaking API removal.
- [x] Revise unfinished milestones and cross-links; keep implementation unstarted.

Validate this documentation revision, then commit/push and run the required
post-push review. Full implementation checks remain in the final milestone.

## Milestone 3: Record unified page designs

Tags: mockup

Extend the existing neutral shell design catalogue with the page states needed
to review the new presentation before changing the real UI.

- [ ] Inspect and reuse `examples/basic/entries/design/parts/` and existing
      Browse screen components, tokens, navigation, frames, and details.
- [ ] Add linked standalone page-view and page-details designs, plus a removed
      page state, each with its own mobile and desktop screen components.
- [ ] Author the reusable synthetic whole-document sample used by those designs
      and the later basic-example registration; complete its markup in this milestone.
- [ ] Show a page beside a screen/use case under one existing collection,
      correct ancestry and ID/tag search, page metadata, and a narrow navigation
      drawer. Hide unsupported page variant/comparison controls.
- [ ] Keep synthetic document content confined to the approved example design
      fixture. No engineering/migration annotations appear inside rendered screens.
- [ ] Link new screens from the owning design catalogue; keep each owning
      screen-spec page at five or fewer screen mockups and split linked pages when
      needed. Reuse owning screen components in any flow.
- [ ] Update the shell design protocol and example README; run
      `npm run example:build`, `npm run example:check`, relevant example tests, and
      typechecking. Commit generated HTML from source; open every changed mobile
      and desktop artifact directly from disk for visual inspection.

The generated design catalogue remains functional and specifies all new UI
states without requiring backend or product markup changes in this milestone.

## Milestone 4: Implement page definitions and source migration

Add the backend authoring, compilation, schema, and historical compatibility
boundaries while preserving existing complete-document rendering.

- [ ] Add failure-first tests for flat/nested pages, callback attribution and
      validation, tag/inheritance rules, mixed children, invalid page-valued
      use-case steps, duplicate IDs/routes, missing/multiple parents, and cycles.
- [ ] Extend `src/authoring/` and exports with typed page inputs/definitions,
      `definePage`, and nested `page`; update entry preparation and validation.
- [ ] Remove legacy config/types, automatic discovery, and `src/legacy/pages.ts`.
      Add rejection tests for obsolete configuration, including `undefined`, and
      prove unimported `.source` modules are not catalogue entries. Migrate
      affected fixtures alongside these changes; add no registration shim.
- [ ] Add tests before changing rendering: synchronous complete HTML, one
      render/output, imported existing render helpers, exception and
      promise rejection, global dark configuration, and unchanged source content.
- [ ] Implement the shared page output path without invoking the screen
      renderer. Preserve the complete validation/transform pipeline and consumer
      module/React resolution. Keep artifacts and declarations fully typed.
- [ ] Add generated-ownership, source-root, output collision, deterministic
      build/check, orphan, rollback, path traversal, symlink, and foreign-file
      tests, including page routes that overlap another entry's fragments.
- [ ] Test that old artifacts outside the new owner roots still reject
      overwrite, and that verified consumer regeneration succeeds without
      broadening ownership. Keep imported render helpers protected source inputs.
- [ ] Implement schema-v4 serialization/strict validation and dedicated
      v2/v3 historical readers. Test stale current output, invalid canonical input,
      gated v2 fallback, exact-route legacy baseline matching, unmatched historical
      documents, and unchanged screen comparisons across schema versions.
- [ ] Persist and validate `sourceFiles` from the shared authoring graph for
      server/publisher source protection without a legacy source-root setting.
- [ ] Prepare common catalogue indexes and route/artifact lookups for pages;
      eliminate assumptions that every routed non-use-case entry is a screen.
      Update active runtime readers and fixtures coherently with the schema switch.
- [ ] Run `npm run build`, typechecking, lint, and focused authoring, config,
      registry, manifest, build, compatibility, and baseline/safety tests.

The page compiler and model are tested, old generated documents remain safe to
migrate, and complete runtime adoption has a typed backend to consume.

## Milestone 5: Complete runtime links, impact, and publication

Make every non-visual consumer understand the same page model before the shell
and consumer fixtures switch to it.

- [ ] Add a mixed-tree regression reproducing the two App groups and assert
      one explicit App/Book ancestry after registration. Retain coverage proving
      unrelated same-title collections stay distinct and unclaimed pages are leaves.
- [ ] Update catalogue/hierarchy and route-target models, page artifact lookup,
      GET/HEAD handlers, `/view`, `/id`, `/static`, and validated fragment transport.
- [ ] Replace route-derived legacy tree/Overview model builders with the common
      collection tree; keep all runtime models ready before shell presentation changes.
- [ ] Add page-to-screen, screen-to-page, page-to-page, use-case-to-page-link,
      anchor, and `MockLink asChild` tests for served and portable output. Preserve
      final-transform validation, authenticated link ownership, and sandbox limits.
- [ ] Update Changes projections, page output/dependency candidates, shared
      impact, and removed-v4-page metadata. Test reparenting, title edits, unrelated
      shared-module edits, route reuse, old baselines, and screen-only diff requests.
- [ ] Update watcher inputs, reload attribution, and published catalogue
      assembly, including page resources, ID redirects, anchors, and removed-page
      states only when publication includes Changes. Honor the optional-publication
      contract and preserve transactional/screen-comparison behavior. Test that
      imported helpers remain watched and unavailable through static routes.
- [ ] Update focused fixtures at each boundary, run relevant server, navigation,
      watch, review, preview, safety, and packed-API tests, and run the build.

The runtime can resolve and publish page artifacts safely using one model;
screen comparisons and existing consumer output remain functional.

## Milestone 6: Use one hierarchy throughout Browse

Tags: ui

Apply the completed designs to the real package shell using the page-aware
runtime. This milestone contains presentation and client work only.

- [ ] Add shell/browser regressions before replacing the legacy navigation and
      route-target presentation. Verify one row per ID and one declared App group.
- [ ] Render all collection children from the completed common tree and remove
      obsolete legacy presentation branches. Preserve page icons and independent
      stable collection identities.
- [ ] Reuse the full-document frame and add authored title, ID, breadcrumbs,
      tags, details, home counts, and the removed-page state from the mockups.
      Hide irrelevant controls and preserve screen selections across navigation.
- [ ] Exercise ID/title/route/tag search, All/Changes, active-row reveal,
      disclosures, scroll restoration, direct/in-frame links, Back/Forward, watch
      reparenting, and static fragment restoration at mobile and desktop widths.
- [ ] Verify pages honor both publication capabilities: ordinary exports contain
      current pages only; opted-in exports retain page Changes and removal states.
- [ ] Ignore old `legacy:` disclosure keys without resetting existing
      `collection:` state or applying saved state by title. Verify this on reload.
- [ ] Start the real server and compare screen, page, use-case, and missing-page
      views with their designs. Run focused shell/client tests, Chromium tests,
      accessibility assertions, and visual smoke tests.

Browse now shows one catalogue hierarchy and complete page metadata while
retaining the existing complete-document and screen presentation behavior.

## Milestone 7: Prove the required consumer upgrade

Activate the final v4 contract across examples, packed consumers, and migration
guidance, and rehearse the actual Accounting inventory before release.

- [ ] Register the already-designed synthetic document as a page in the basic
      example and use `definePage` in the Accounting packed fixture. Convert raw
      HTML comment components into consumer composition, make aliases explicit
      routes, and preserve applicable lint rules in consumer source-policy tests.
      Update ESM/NodeNext/npx/Juno checks for the new API/schema.
- [ ] Verify current readers/outputs require v4 and no legacy discovery/config
      adapters remain. Keep historical v2/v3 readers at the comparison boundary
      and retain their regression fixtures and ownership-header parsing.
- [ ] Update the package/runtime/navigation/Changes/watch/architecture docs,
      README, and example guidance to describe implemented behavior. Change the
      target protocols' delivery status only when their required behavior passes.
- [ ] Build and pack the candidate. In a disposable Accounting checkout,
      create the five normal page definitions and collection memberships,
      remove `legacy` config, update consumer policy tests/docs, and perform the
      verified old-artifact regeneration. Do not alter the synced inspection workspace.
- [ ] Validate complete pre/post source, route, anchor, and artifact inventories;
      preserve all product screens, links, resources, and four real root collections.
      Keep the consumer patch and exact tarball identity under `.context`.
- [ ] Run Accounting mockup build/check/test/typecheck, relevant browser tests,
      its required repository gate, and real-server mobile/desktop smoke tests of
      all five pages, incoming links, search, ancestry, and exactly one App group.

The package has a verified migration path and recorded consumer rehearsal.
Actual consumer adoption remains explicitly separate from this evidence.

## Milestone 8: Verify, commit, push, and review

Finish implementation delivery only after all required checks pass; keep the
complete new source, tests, docs, and generated artifacts in the reviewed diff.

- [ ] Run all relevant tests with a 100% pass rate, `npm run build`, lint,
      typechecking, example build/check, packed consumers, and browser tests. Run
      `cargo xtask check` as the authoritative full gate; fix failures before
      claiming completion. Avoid repeating passed checks without a new concern.
- [ ] If Rust changes, run `cargo fmt --all -- --check`, clippy, relevant Rust
      tests, and the required file-length audit; fix any formatting/build errors.
- [ ] Fetch/audit main from the captured source tip before integration; preserve
      its additions. Inspect the diff and deletions against `origin/main` and stop
      for any unapproved feature removal. Validate Markdown links and generated
      output and record verification results in this plan.
- [ ] Run `git add -A`, commit the completed implementation using Conventional
      Commits with a title of at most 50 characters and an explanatory body, push
      the branch, and inspect the committed diff/deletions against `origin/main`.
      Use breaking-change notation and record the authorized removal of legacy
      configuration/discovery/rendering, related cleanup, and consumer upgrade
      requirements in the implementation commit and release notes.
- [ ] After the push, run `cargo xtask review` against `origin/main`. Do not
      automatically fix its findings. Report every item with severity, feature
      context, impact, lettered options, and a clear recommendation that evaluates
      whether a broader rule/test/abstraction would prevent recurrence.
- [ ] Record the review outcome and unresolved decisions; mark only finished
      milestones complete and move this plan to Completed when all required work
      is done. Validate and commit/push final documentation bookkeeping if needed.

## Consumer Follow-Up (Outside Package Completion)

After a suitable package version is available, deliver the rehearsed Accounting
page definitions, collection memberships, source-policy updates, docs, and
generated output on an Accounting branch. Run that repository's full required
checks and commit/push/review workflow and repeat the five-page smoke test.
Coordinate npm publication and consumer adoption separately; do not add tasks
that require an already-merged package PR to a required milestone here.
