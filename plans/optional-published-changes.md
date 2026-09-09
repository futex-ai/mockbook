# Optional Published Changes

## Status And Outcome

Planning only; implementation has not started. The user requested an option
after reviewing whether Changes belongs in a published catalogue.

Publish the current catalogue by default. Authors can explicitly include
Changes and comparisons against a baseline fixed during publication. PR
previews enable that option; the main reference catalogue uses the default.

[Optional Changes In Published Catalogues](../docs/protocol/mokabook-publication.md)
owns the complete target, commands, failure behavior, and acceptance criteria.
Current shipping behavior remains documented separately until implementation.
This applies to all entry kinds and can ship independently of
[Unified Catalogue Pages](./unified-catalogue-pages.md). That plan supplies page
impact and removed-page metadata when first-class page support lands.

This plan changes export behavior and its workflow invocations. Actual site
deployment and npm publication are outside the implementation delivery gate.

## Milestone 1: Define optional publication — completed

Record the chosen default and opt-in behavior before implementation.

- [x] Inspect the existing static exporter, review pipeline, and preview jobs.
- [x] Define the option, fixed baseline, omitted capabilities, failure behavior,
      and PR/main workflow selection in a target protocol.
- [x] Update the page contract and plan so removed pages are required only in
      publications that include Changes; index and cross-link this plan.

Validate Markdown, local links, and the diff for this planning revision, then
commit/push and run `cargo xtask review`. Documentation-only changes are exempt
from `cargo xtask check`; implementation uses the final milestone below.

Planning validation passed: Prettier, 101 local Markdown link targets, both plans'
milestone/checklist/index structure, and whitespace checks. The integration audit
preserved all 51 paths changed on main from the recorded source tip; the complete
branch diff against main remains documentation only. Post-push review follows.

## Milestone 2: Design both publication states

Tags: mockup

Define the visible capability difference using existing shell designs.

- [ ] Read the shell design protocol and example README; reuse the existing
      Browse and review components under `examples/basic/entries/design/`.
- [ ] Create linked standalone mobile/desktop screens for the current catalogue
      with review omitted and included. Hide Changes/counts and diff controls
      when omitted; retain search, tags, navigation, viewport, and color choices.
- [ ] Keep each screen in its own component, reuse it in flows, and keep owning
      screen-spec pages within the five-screen limit. Avoid environment labels.
- [ ] Update design docs, build/check generated examples, run relevant tests
      and typechecking, and visually inspect each changed artifact from disk.

The functioning design catalogue specifies both publication states before UI
implementation begins.

## Milestone 3: Implement publication options and capture

Add the option and export capability boundaries with the existing product
functional throughout. Keep the script explicitly including review until the
shell is ready and the final milestone switches its public default.

- [ ] Add failure-first tests for argument validation and the internal typed
      option contract; prepare the parser and `buildPreview` option plumbing.
      Keep public script invocation on the existing review-enabled path.
- [ ] Add an explicit review capability to capture/server context. Implement
      default publication with no Git/change/history/provider work, current-only
      route capture, and absent comparison endpoints and generated artifacts.
- [ ] Test and implement explicit review capture with one pinned merge base,
      consistent current inputs, immutable packaged comparisons, and actionable
      failure without fallback when the base or comparison is unavailable.
- [ ] Exclude existing review artifacts from public copying in both options.
      Test review-to-default replacement, ID/route precedence, source/resource
      safeguards, rollback, and isolation from a running development server.
- [ ] Update internal comparison fixtures to opt in. Run build, lint,
      typechecking, and relevant preview, review, server, and safety tests.

Both backend capabilities are tested and ready for the shell and workflow switch.

## Milestone 4: Activate optional review in publication

Tags: ui

Apply the completed designs using the established backend capabilities. Keep
this milestone limited to shell/client presentation and browser validation.

- [ ] Add shell/browser regressions before enabling the new presentation. Use
      the explicit capability to omit Changes/counts/diff controls by default
      and retain the existing comparison experience when included.
- [ ] Normalize stored review preferences and direct review links to All/Current
      when review is unavailable; preserve route, scheme, viewport, and anchor.
- [ ] Verify zero-change review, removed entries when supported, search/tags,
      navigation, Back/Forward, and absence of comparison requests by default.
- [ ] Run focused shell/client and Chromium tests. Start the real server and
      serve both generated artifacts for mobile/desktop visual smoke tests.

The shell presents both completed options without altering local development.

## Milestone 5: Switch workflows, verify, commit, push, review

Deliver the completed behavior with documented commands and explicit workflow
selection after the UI is ready.

- [ ] Activate the documented CLI options and default after the shell is ready.
      Set the main workflow to the default command and PR previews to
      `--include-changes --base origin/main`; preserve deployment safeguards.
      Update workflow assertions and comparison build invocations.
- [ ] Update README, Changes/runtime, release, and example documentation to
      implemented behavior. Update the page plan's publication integration;
      do not imply that its separate page API is already implemented.
- [ ] Run all relevant tests with a 100% pass rate, build, lint, typechecking,
      example build/check, preview builds in both options, packed-consumer and
      browser checks. Run `cargo xtask check` and fix failures before completion.
      If Rust changes, run fmt, clippy, tests, and the required file-length lint.
- [ ] Fetch main and audit its additions from the captured pre-integration tip;
      preserve all unrelated features. Inspect the diff and deletions against
      `origin/main`, validate Markdown/links, and record verification results.
- [ ] Run `git add -A`, commit all completed work with a Conventional Commit
      title of at most 50 characters and an explanatory body, then push. Record
      the authorized change to default publication and retained opt-in review.
      Inspect the committed diff and deletions against `origin/main`.
- [ ] After the push, run `cargo xtask review`. Do not automatically fix its
      findings; report numbered items with severity, context, impact, lettered
      options, and a recommendation considering broader prevention.
- [ ] Record unresolved findings, complete only finished milestones, and move
      this plan to Completed in the index when all required work is done.
      Validate and commit/push final documentation bookkeeping if needed.
