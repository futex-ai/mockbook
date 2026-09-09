# Mokabook Design MockLinks

## Outcome And Status

Make Mokabook's own design catalogue navigable through its pictured links,
rows, and supported state controls, in both mobile and desktop variants.
The basic example's prominent buttons also demonstrate `MockLink asChild`.

Status: planning only. The user requested this plan; no screen, runtime, test,
or generated-output implementation has started. The complete target contract is
[Design mockup links](../docs/protocol/mokabook-design-links.md), which builds
on the implemented [navigation](../docs/protocol/mokabook-navigation.md) and
[child controls](../docs/protocol/mokabook-link-controls.md) contracts.

## Baseline And Boundaries

- Nineteen design screens produce 38 light-only mobile/desktop files. All 38
  currently contain zero native links and zero mock-link markers.
- `entries/catalogue.mockup.tsx` has three working text links, but its two
  Firna buttons use only no-op handlers. The package already implements and
  tests `MockLink`, `asChild`, portable hrefs, and Browse enhancement.
- Shared adoption points are the `nav`, `shell`, `stage`, `details`, `compare`,
  `review`, and `tag_filter` components under `entries/design/parts/`.
  `design.mockup.tsx` owns the catalogue; existing screen modules own each
  standalone artboard.
- Five new standalone states are required: normal light Details, an unfiltered
  open tag picker, closed forms/onboarding filters, and an open onboarding
  picker. Preserve every existing id and route, including the forms-open
  `design-browse-tag-filter` and inspector `design-browse-details` screens.
- Use the contract's explicit destination tables. Design navigation targets
  design ids; real example navigation targets example ids. Never route by
  visible labels or invent a live `example-farewell` entry.
- Links use canonical depicted states; local copy/resize/refresh/viewport
  controls remain visual depictions. The actual outer shell retains its
  runtime behavior. The contract lists unsupported state combinations
  explicitly so a shared control cannot silently switch subjects.
- No new package dependency, API, server, adapter, or application UI work is
  required. This is consumer/mockup adoption. Runtime defects discovered during
  implementation need regression tests and a new backend milestone immediately
  after the active milestone. Follow it with a new tagged mockup milestone and
  move blocked tasks there, preserving their incomplete status.

## Milestone 1: Define the adoption contract — completed

Outcome: an indexed plan with explicit scope, targets, unavailable controls,
and verification requirements, without implying the implementation has shipped.

- [x] Inspect all design screen/component families, generated HTML, example
      links, related READMEs, navigation contracts, and existing browser tests.
- [x] Fetch `origin/main` and audit from source tip
      `bb3a22facae6b98355c4e20effdfd47676f8fdb6`; main is the same commit, with
      no divergent mainline additions or existing workspace changes.
- [x] Define the complete target protocol before creating this plan.
- [x] Create this change-specific plan and add it to `plans/README.md` Active.
- [x] Link the pending adoption from the protocol index, shell contract, and
      example documentation while retaining the current implementation status.

## Milestone 2: Complete the owning design screens

Tags: mockup

Outcome: every required destination renders independently in the catalogue,
with a coherent mobile/desktop depiction and reusable screen components.

- [ ] Add and run failing registry/rendering assertions for the five new
      destination ids, both viewport variants, and their specified states.
- [ ] Add `design-browse-details-screen` at the contracted route. Reuse
      `MiniDetails`; keep it distinct from Welcome's expanded inspector and
      the existing dark-selected light-only Details artboard.
- [ ] Add the four tag states under matching nested source/output directories.
      Reuse shared tag/screen components and retain the current forms-open
      page's id, route, and subject. Each screen has its own mobile and desktop
      component; flows must import those owning components.
- [ ] Represent the contracted query, selected chip, tree rows, picker
      visibility, and light/dark state consistently. Add the scheme control
      to each endpoint of the three specified scheme pairs.
- [ ] Give Details its own depicted metadata; make shared inspector data typed
      by subject so Details and removed comparisons cannot show Welcome paths,
      descriptions, tags, or live-use-case links accidentally.
- [ ] Register the new entries beneath the existing design hierarchy without
      renaming/moving existing entries. Keep each generated screen-spec page
      within five screens and any new nested pages in matching directories.
- [ ] Reuse existing mockup CSS and components; split touched modules that
      exceed 300 lines into coherent siblings rather than compacting markup.
- [ ] Update the shell design route inventory and example documentation for
      the added states. Describe link adoption as pending until it is wired.
- [ ] Run `npm run build`, `npm run example:build`, `npm run example:check`,
      relevant rendering tests, and `npm run typecheck`. Open all added pages
      directly from disk and inspect both variants before starting link wiring.

## Milestone 3: Wire shared design navigation

Tags: mockup

Outcome: the design catalogue supports the specified navigation journeys using
the existing public authoring API and shared components.

- [ ] Create `tests/design_links.test.ts` with failing semantic assertions for
      the existing home action, nav leaves, miniature screen links, flow
      references, inspector action, and comparison control destinations. Run
      them against the built real example before adding those links.
- [ ] Add a typed destination map and navigation context in small modules
      under `entries/design/parts/`; separate depicted subjects from catalogue
      targets and provide explicit inactive states. Validate targets against
      the real manifest, not a second hardcoded registry.
- [ ] Adopt `MockLink`/`asChild` in the brand, home/recovery actions, navigable
      crumbs, catalogue leaves, drawer entry/exit, and All/Changes choices.
      Keep collection ids out of link destinations and avoid anchors wrapping
      disclosures or child rows.
- [ ] Wire `MiniWelcome`, `MiniDetails`, and `MiniFarewell`, preserving the
      specified scheme pair where it exists. Wire both use-case step references
      to their owning standalone design screens; keep the visible reference
      consistent with the destination rather than printing another entry's id.
- [ ] Wire Welcome inspector open/close and the subject-appropriate Example
      tour link. Give any inactive inspector action an explicit non-link state
      rather than defaulting all subjects to Welcome's expanded inspector.
- [ ] Wire the three scheme pairs and supported comparison modes. Test
      Added/Removed, dark, shared-impact, ignored-only, and empty Changes
      separately so shared controls cannot route them to unrelated scenarios.
- [ ] Wire tag picker open/close, both tag choices, active-tag clearing, and
      supported inspector chips exactly as the protocol table specifies.
- [ ] Preserve full clickable areas, color inheritance, icon sizing, wrapping,
      and focus outlines after adaptation. Links use link semantics; inactive
      depictions have no href, marker, or misleading tab stop.
- [ ] Rebuild and validate the example, run focused tests and typechecking,
      then smoke-test Home → Welcome → Details → Welcome and the use-case,
      drawer, scheme, tag, and comparison journeys in both variants.

## Milestone 4: Demonstrate styled example navigation

Tags: mockup

Outcome: the real Firna example demonstrates styled links through the same
renderer and generated-output pipeline as consumers.

- [ ] Add and run failing assertions for the two styled fixture buttons in
      all four viewport/scheme combinations, including the Details fragment.
- [ ] Change the primary button to `View details`, wrap it with
      `MockLink asChild` targeting `example-details` and fragment `details`.
- [ ] Change the secondary button to `Return to welcome`, targeting
      `example-welcome`. Keep the component's required no-op handler and all
      existing text links; static anchors perform navigation.
- [ ] Rebuild the example and test the buttons within their standalone screen
      and the real `example-tour` frames using pointer and keyboard activation.
- [ ] Update the root/example READMEs and example notes with navigation usage
      and the precise distinction between linked design states and depicted
      runtime controls. Update obsolete statements that every design link is
      styled text, and keep engineering notes outside rendered artboards.

## Milestone 5: Verify every output surface

Tags: mockup

Outcome: source, committed HTML, actual Browse behavior, portable navigation,
and published-preview behavior agree with the adoption contract.

- [ ] Add `tests/browser/design_links.spec.ts` using the actual example
      catalogue. Cover pointer and Tab/Enter navigation from both design-frame
      variants, expected outer URLs, active rows, Back/Forward, and preserved
      outer viewport selection. Keep the consumer-script denial assertion.
- [ ] Extend the existing direct-file design tests with representative round
      trips, flow references, button focus, and inactive-control checks.
- [ ] Validate every generated design link against manifest destinations in
      both variants. Check every new state's incoming and return navigation;
      assert label/subject/query/picker agreement, not merely a link count.
- [ ] Check the canonical existing-design inventory against the complete
      manifest id/route set; keep pending additions in the feature contract
      until their standalone screens ship.
- [ ] Exercise real example buttons in light/dark output and actual Review
      snapshot fallback. Keep Review's frame-owned links distinct from a
      design artboard that merely depicts a comparison.
- [ ] Run `npm run preview:build` and test the new links with the existing
      preview browser helpers; inspect current/portable files to confirm
      preview adaptation did not mutate committed output.
- [ ] Open every changed generated design/example page directly from disk.
      Inspect both variants, keyboard focus, row hit areas, dark colors,
      toolbar layout, and narrow drawer/picker overlap; save screenshots under
      `.context/` and correct any implementation regressions before delivery.
- [ ] Run the focused build/link/browser suites, `npm run example:check`, and
      `cargo xtask check` with a 100% pass rate. The full gate includes format,
      lint, typecheck, unit/integration tests, packed consumers, browser tests,
      Rust formatting, clippy, and Rust tests. Resolve failures and rerun the
      relevant gate before proceeding.
- [ ] Review the source/generated diff, update all affected contract delivery
      statuses and screen counts, and confirm the five new screens and every
      generated HTML/manifest update will be tracked in the delivery commit.

## Milestone 6: Commit, push, and review

Outcome: the validated implementation is committed, pushed, and independently
reviewed, with findings left for the user's decision.

- [ ] Before any merge/rebase, fetch main, capture the current source tip,
      and audit main's additions from that tip's merge base. Preserve every
      mainline feature; resolve conflicts path by path if integration is needed.
- [ ] After tests and `cargo xtask check` pass, inspect
      `git diff --name-status origin/main`, deletions against main, and the
      complete diff. Stop for any unapproved removal or feature reduction.
- [ ] Run `git add -A`; inspect the staged diff including new source, test,
      generated, and documentation files. Commit with a Conventional Commits
      title of at most 50 characters and an explanatory body.
- [ ] Inspect `git diff --name-status origin/main..HEAD`, then push the current
      branch without renaming it.
- [ ] Run `cargo xtask review` after the push so it reviews the complete
      committed branch diff against `origin/main`.
- [ ] Report every finding with a number, severity, context, impact of doing
      nothing, lettered solution options, and a recommended option. Evaluate
      whether a shared rule/test/abstraction prevents recurrence. Do not
      automatically fix findings from this review.
- [ ] Record the review result and completed milestones, move this plan to
      Completed only when its required tasks are done, and validate/commit/push
      any final documentation record separately if needed.

## Planning Delivery

This initial plan and its protocol changes require Markdown formatting/link
validation and diff review. Repository rules exempt documentation-only changes
from `cargo xtask check`; implementation gates above remain mandatory. Commit
and push the validated planning files, then run `cargo xtask review` and report
its findings without starting implementation. Keep this plan Active.

### Planning Review Record

Planning commit `cde0932` was pushed before `cargo xtask review` completed on
2026-09-09 against `origin/main` at `bb3a22f`. Markdown formatting, 53 local
documentation links, 22 documented catalogue ids, and diff/deletion checks
passed. The documentation-only exemption applied to `cargo xtask check`.
Implementation remains unstarted. These findings were initially recorded for
the user's decision without fixes. The user subsequently authorized valid
review fixes; their disposition is tracked in Milestone 7 below.

1. **Severity: Medium — incomplete existing destination inventory.**
   The reviewer noted that the new contract lists only the five new route
   mappings, while the older shell-design inventory omits the existing Current
   and Overlay routes. The existing destination ids do appear in the new
   control mappings, but their id-to-route inventory is not complete.
   Leaving this ambiguity can make implementers duplicate or move a destination
   that should remain stable. A. Complete one canonical existing-id/route
   inventory, including Current/Overlay, and link to it from the new contract.
   B. Only narrow the new inventory's wording and cross-reference the current
   shell inventory. Recommended: A; keep one owner for the inventory and add
   a manifest cross-check to implementation verification to prevent drift.

2. **Severity: Medium — historical example note can conflict with planned states.**
   The reviewer flagged the old example-notes claim that catalogue-link work
   requires no new design screens. The new introduction says the notes describe
   current artboards, but the historical bullet's phrase “this change” can be
   read as referring to the new five-state adoption. Leaving it ambiguous can
   lead implementers to omit the new Details/tag destinations. A. Scope the
   old statement explicitly to the completed navigation work and cross-reference
   this adoption's five planned states. B. Move the old statement into a dated
   historical section linked to its completed plan. Recommended: A; keep the
   destination contract as the source for the new scope rather than maintaining
   another independent requirements list in example notes.

## Milestone 7: Address approved planning review findings

Outcome: the existing route inventory and historical notes agree with the
planned adoption, while feature implementation remains unstarted.

- [x] Verify the findings independently: the manifest has 19 design screens,
      the old inventory omits Current/Overlay and all entry ids, and the old
      notes refer to the completed in-frame navigation work.
- [x] Complete one canonical id/route inventory, cross-reference it from the
      adoption contract and example README, and require manifest comparison
      during future implementation verification.
- [x] Identify the historical note's completed scope and link to the five
      planned additions in the adoption contract.
- [x] Validate Markdown, local links/anchors, exact manifest inventory parity,
      and the diff. Apply the documentation-only full-check exemption.
- [ ] Preserve the audited mainline logo update, then `git add -A`, commit the
      fixes using Conventional Commits, and push the branch.
- [ ] Run `cargo xtask review` after the push and record/report new findings
      without automatically fixing them; commit/push the final review record.

Validation: the inventory probe first failed for two missing routes and all
19 missing ids, then passed with exact manifest parity after the fix. All 58
local documentation links (including three heading anchors), Markdown
formatting, and diff checks pass. Source tip before integration was `ef2bfd1`;
the audited main addition was `815405e` (screen-stack logo). The merge has no
conflicts, and code, tests, and generated output match `origin/main` exactly.
Only documentation differs from main, so `cargo xtask check` is exempt.
