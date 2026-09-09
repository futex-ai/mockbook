# Component Explorer

Status: active; planning only. No component feature code is implemented by the
initial documentation change.

Implement the approved [component authoring contract](../docs/protocol/mokabook-components.md),
[change attribution](../docs/protocol/mokabook-component-changes.md),
[pages and inspection](../docs/protocol/mokabook-component-explorer.md), and
[local controls](../docs/protocol/mokabook-component-controls.md).

The central rule is that a component-only change puts the component in Changes.
Its consuming screens appear under Affected screens on the component page;
they neither appear in Changes nor increase its count unless their own inputs,
content, structure, or other independent material changes. Existing propagation
from directly changed screens to their use cases remains intact.

Scope includes the Mokabook package, protocol docs, existing design catalogue,
consumer fixtures, and served/published verification. Saved variants work in
both delivery modes. Editable props use local server rendering in a later
milestone. A browser React runtime, hosted arbitrary rendering, downstream app
migrations, and publishing an npm release are outside this change.

## Execution Rules

Keep the existing catalogue functioning after every milestone. Backend
capabilities can be exercised through internal fixtures until their shell is
ready; expose the public opt-in API in the final integration milestone. Do not
release a component entry that crashes existing Browse or publishing paths.

Mockup and UI milestones are separate from backend work. If either discovers
missing backend work, insert a new backend milestone immediately afterward,
then a new tagged mockup/UI milestone containing the blocked, unchecked tasks.
Do not reopen completed milestones or move those tasks into an existing one.
Add other newly discovered TODOs to the relevant active milestone.

For regressions, add the failing test before fixing the implementation. Run
focused tests after each unit, build new modules/services, and smoke-test newly
usable behavior. Keep source files near 200 lines and below the repository's
hard caps. New documentation describes target behavior until it is delivered.

## Milestone 1: Define the contract — completed

Record the agreed behavior and its integration boundaries before implementation.

- [x] Inspect registry, render markers, props material keys, Browse Changes,
      comparison assets, Details, publishing, and the owning design catalogue.
- [x] Record the distinction between directly changed entries and affected
      consumers, including screen-owned props/slots and nested ownership.
- [x] Define saved variants, data/instance records, migration behavior, screen
      highlighting, and local-only editable controls in target protocol docs.
- [x] Create and index this plan; link planned behavior without claiming it ships.
- [x] Preserve mainline additions: captured source tip
      `f11e516d144b4616986423ccf3e8ed86095eed21`, fetched/audited main, and
      fast-forwarded to `bb3a22f` to retain its search-icon fix without conflicts.

## Milestone 1a: Complete the reviewed contract — completed

Apply the four approved findings from the initial review of `6bf3183`.
This adds a documentation milestone without reopening completed Milestone 1.

- [x] Define exact [manifest v4](../docs/protocol/mokabook-component-manifest.md)
      and [comparison v3](../docs/protocol/mokabook-component-review.md) interfaces,
      references, sorting, optional fields, path rules, and shared fixture checks.
- [x] Require one [runtime prop schema](../docs/protocol/mokabook-component-props.md)
      for derived types, authoring, variants, controls, recorded props, and hashes.
- [x] Specify memory-only transient rendering and no-file/watch-feedback tests;
      clarify README links to registration, attribution, inspection, and controls.
- [x] Validate changed Markdown, local links, and the normative TypeScript
      declarations. Keep feature code unimplemented and the plan Active.

## Milestone 2: Build component registration and ownership

Deliver tested internal authoring/build support while current public catalogues
continue to work. Standalone generated fixtures prove the component renders.

- [ ] Implement typed/runtime-validated definitions, variants, controls metadata,
      slot declarations, component wrappers, and explicit repeated-instance ids.
- [ ] Share the explicit prop-schema validator and canonical codec across all
      callers; test rejected JS/TS inputs, optional/uncontrolled fields, unions,
      nested values, key round trips, negative zero, and mutation isolation.
- [ ] Extend source attribution, collection validation, discovery, and the
      single consumer graph without inferring usage from import lists.
- [ ] Capture actual per-view instances, input material, caller-owned slots,
      parent/owner relationships, order, and layout-neutral DOM ranges.
- [ ] Verify deterministic fixed-size instance/slot keys through deep nesting
      and forwarding; reject invalid digests and conflicting duplicate records.
- [ ] Extend the existing renderer for components and optional style/resource
      ownership, retaining plain-string renderers and consumer theme providers.
- [ ] Generate variant fragments and manifest v4; retain v3 output bytes for
      unregistered catalogues and existing v2/v3 baseline readers.
- [ ] Implement the normative manifest types/validator with shared accepted and
      rejected fixtures, reference/path checks, and deterministic serialization.
- [ ] Validate nested/multi-root/text/null boundaries, reserved metadata,
      compatibility transforms, owned dependencies, and unsupported inputs.
- [ ] Extend transactional output, collision/orphan checks, links, variant
      resources, and id destinations through existing shared validation.
- [ ] Add unit/integration fixtures for duplicate/missing identities, slots,
      repeated/nested instances, invalid metadata, both viewports/themes,
      renderer failures, and unregistered/legacy compatibility; build and run
      focused tests and standalone rendering smoke checks.

## Milestone 3: Attribute changes and publish component data

Deliver one tested classification policy and complete comparison artifacts,
with lightweight Browse detection and no eagerly generated snapshots.

- [ ] Add failing regressions for a component-only edit currently flagging its
      consumers through raw generated paths, broad dependencies, or shared impact.
- [ ] Implement owner-aware normalization and input comparison; retain slot
      material, repeated-instance order, empty instances, and one-sided adoption.
- [ ] Compare component variants without suppressing their own root; classify
      nested child implementation and parent-supplied input changes separately.
- [ ] Integrate owned source/assets/head styles and conservative mixed/global
      evidence without globally removing existing dependency or ignore rules.
- [ ] Make Browse, watch updates, comparison results, counts, and use-case
      propagation use the same direct-change/affected distinction.
- [ ] Generate component results and baseline/current affected-consumer links,
      including transitive use, removed screens/components/variants, and explicit
      missing sides; keep before/after documents and assets unmodified.
- [ ] Extend served/published data and artifact packaging, historical schema
      readers, immutable generations, and cache invalidation for component views.
- [ ] Implement the normative result schema and Changes reasons; share fixtures
      across producers/readers to prove exact membership, sides, and usage chains.
- [ ] Test every attribution-contract table row, unchanged-render prop changes,
      slots, simultaneous component/screen edits, asset-only changes, migration,
      light/dark/mobile/desktop, and no snapshot work from ordinary browsing.
- [ ] Run focused suites and comparison/build smoke checks; prove published
      component data and isolated resources agree with local classification.

## Milestone 4: Design component pages and screen inspection

Tags: mockup

Approve the visual contract in the existing generated design catalogue before
implementing the shell UI. No backend work belongs in this milestone.

- [ ] Reuse the owning components in `examples/basic/entries/design/parts`;
      create distinct mobile and desktop screens for component browsing, saved
      variants, comparisons, Used by, and changed-component Affected screens.
- [ ] Design screen Details usage/props, nested and repeated selection,
      highlighting, and empty/unavailable/removed states with accessible controls.
- [ ] Show component-only versus direct-screen Changes membership and counts.
      Link component and screen views through the existing catalogue navigation.
- [ ] Split owning screen-spec pages at five screens; give nonterminal pages
      a canonical representation and linked child pages. Keep screen components
      reusable, flow links correct, and engineering notes outside the screens.
- [ ] Update the shell design contract and example README; run
      `npm run example:build`, `npm run example:check`, and relevant design tests.
      Open every changed generated page directly from disk in both variants and
      inspect its layout. Commit matching generated HTML with its source.

## Milestone 5: Implement component pages and inspection

Tags: ui

Deliver the designed shell against the validated backend records. No backend
or rendering-contract changes belong in this milestone.

- [ ] Reuse shell navigation, search/tags, Details, preview, and comparison
      components; add component entries, saved-variant selection, and suitable
      canvases with viewport/theme and URL/history behavior.
- [ ] Render Used by/Affected screens from actual current/baseline evidence,
      including removed consumers and links into the correct screen instance.
- [ ] Add the screen Details component tree, counts, props/slots, instance
      selection, and explicit empty/unavailable states for the active view.
- [ ] Add the Highlight components toggle, mask/outline/label presentation,
      nested drill-down, and two-way selection between DOM regions and Details.
- [ ] Track multi-root/text bounds, clipping, nested scroll, frame resize,
      expansion, fonts/images, viewport/theme swaps, and null/hidden instances
      without changing consumer layout, styles, or inherited opacity.
- [ ] Implement keyboard selection, focus return/Escape, inspection click
      handling, comparison exclusion, and full listener/mask cleanup on navigation.
- [ ] Use the same package inspector in served/published shells, preserving
      authenticated immediate-frame access and script-disabled consumer frames.
- [ ] Add real-shell browser tests for responsive pages, variants/comparisons,
      actual metadata, highlight geometry, accessibility, history, and cleanup;
      smoke-test local and published saved-variant workflows against mockups.

## Milestone 6: Add the local controls rendering service

Deliver bounded temporary rendering through the existing consumer graph; keep
the endpoint inactive in published output and independent of generated files.

- [ ] Implement the typed control schema, overrides/unset validation, generation
      checks, and render request/result/error contracts from the controls spec.
- [ ] Add the private POST endpoint with Host/origin/token validation, method,
      body-size, unknown-prop, and component/variant/view enforcement.
- [ ] Reuse consumer adapters/providers and the full marker/link/resource
      validation pipeline in a supervised worker with bounded jobs and timeout.
- [ ] Return immutable transient preview URLs and usage records; implement
      memory-only bundles, count/byte/lifetime bounds, expiration, valid resource
      resolution, no-store/nosniff headers, and cleanup without disk spill.
- [ ] Integrate successful/failed watched replacement, stale-generation handling,
      cancellation, worker recovery, and shutdown with the last-good lifecycle.
- [ ] Test control types/presets, malformed or unauthorized requests, unchanged
      committed output, queue/artifact limits, failure/timeout/restart, and shutdown.
- [ ] Assert controls create no filesystem output, Git changes, watch events,
      rebuild/reload loops, Check orphans, or publication entries, including with
      a repository-root watch rule; verify memory is released on shutdown.
- [ ] Build and smoke-test real consumer rerenders while browsing/watching;
      prove static publishing has no rendering endpoint or background requests.

## Milestone 7: Design editable component controls

Tags: mockup

Extend the component-page design with local controls and published saved-variant
behavior before implementing the new controls UI.

- [ ] Create mobile/desktop screen components for controls, edited values/reset,
      pending/error/retry, comparison of the saved variant, and read-only controls.
- [ ] Reuse the component page and existing inspector patterns; link all states
      from their owning pages and follow screen caps, hierarchy, and flow rules.
- [ ] Keep copy focused on editing/choosing variants; put prop details in the
      inspector and avoid environment labels or renderer implementation copy.
- [ ] Update design docs; regenerate/check the example, run relevant tests,
      and visually verify every changed generated page directly from disk.

## Milestone 8: Implement editable component controls

Tags: ui

Connect the designed controls to the existing local rendering service without
introducing backend work or altering committed variant comparison semantics.

- [ ] Render text/boolean/number/select controls and optional/unset states from
      real definitions; implement validation, debounce, reset, and preset choices.
- [ ] Manage temporary props across viewport/theme changes and discard them on
      variant change, navigation, reload, or entry into saved-variant comparison.
- [ ] Handle pending/error/retry/expiration and sequence/generation cancellation
      while retaining the last valid preview and matching inspector metadata.
- [ ] Keep published controls read-only, with functional saved variants and no
      requests to local render endpoints; use capability data rather than badges.
- [ ] Add browser tests and local/published smoke checks for real prop updates,
      rapid edits, stale responses, reset, navigation, comparisons, failure, and
      responsive keyboard access. Verify the UI against both mockup variants.

## Milestone 9: Integrate the public API and verify delivery

Enable the complete capability, prove real consumer integration, and bring
documentation into alignment with the tested implementation.

- [ ] Export the now-complete public authoring API and types; add clean packed
      ESM/NodeNext and cross-platform consumer coverage using actual components.
- [ ] Extend the basic consumer fixture with a shared component used by multiple
      screens, repeated/nested usage, slots, owned styles, and saved variants.
- [ ] Update the package README, example README, build architecture, and current
      package/runtime/navigation/Changes/shell protocols with delivered behavior,
      adoption instructions, and static-controls limitations. Retain target status
      on any behavior still incomplete.
- [ ] Exercise source/style/prop edits through watched Serve; confirm matching
      Changes counts, affected links, comparisons, and unchanged source artifacts
      during controls edits. Build and smoke-test the published catalogue.
- [ ] Run relevant unit/integration/browser/package suites, example build/check,
      lint, formatting, typechecking, and `cargo xtask check` with a 100% pass rate.
      Run Rust fmt/clippy/tests when Rust changes; fix compile failures and retry
      progressing timeouts. Record commands and any real blockers.

## Milestone 10: Commit, push, and review implementation

Deliver the validated implementation through the mandatory post-push review.

- [ ] Before integration, capture the source tip, fetch main, and audit its
      additions; preserve mainline features and resolve conflicts path by path.
- [ ] After tests and `cargo xtask check` pass, inspect the full diff and
      deletions against `origin/main`, then run `git add -A` so new sources,
      tests, docs, and generated files all enter the review diff.
- [ ] Commit using Conventional Commits with a title of at most 50 characters
      and a descriptive body; inspect the committed diff and push the branch.
- [ ] Run `cargo xtask review` after that push. Do not automatically fix findings.
      Report every item with severity, feature/code context, impact of doing
      nothing, lettered options, and a recommended scope, considering reusable
      validation, tests, or architectural prevention of the same class of issue.
- [ ] Record validation and review disposition, complete the milestones only
      when their tasks are done, and move this plan from Active to Completed.
      Validate and commit/push any final delivery-record update separately.

Documentation-only plan/protocol changes use AGENTS.md's exception: validate
changed Markdown and review the diff instead of running `cargo xtask check`,
then commit, push, and run `cargo xtask review`. This does not complete the
implementation milestones or move the plan out of Active.
