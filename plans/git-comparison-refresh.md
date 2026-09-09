# Git Comparison Refresh

Implement the approved [comparison-state contract](../docs/protocol/mokabook-comparison-state.md)
and [refresh lifecycle](../docs/protocol/mokabook-comparison-refresh.md).
Status: active; the contract is complete and implementation has not started.

Mokabook currently observes authored files but ignores Git metadata. Changes
routes, removed-screen navigation, and comparison snapshots can retain different
baselines after a ref-only update or merge completion. Deliver one coordinator
that observes local Git refs, captures a shared baseline, publishes complete
catalogue updates, and handles explicit Refresh through the same rules.

Use Git polling and coordinated state adoption instead of recursively watching
Git internals or restarting the server for every Git operation. This takes more
work than automatic child restarts but closes the separate-cache and removed
metadata gaps, supports linked worktrees, and prevents stale asynchronous work
from winning. Preserve branch-point attribution, lazy generation, existing
controls, and published artifact behavior. No automatic fetch or downstream
consumer migration is included.

## Milestone 1: Specify the contract — completed

Provide a complete approved target without describing it as shipped behavior.

- [x] Trace current Git, watch, IPC, catalogue, comparison, and reload ownership.
- [x] Fetch main and audit additions from source tip
      `bb3a22facae6b98355c4e20effdfd47676f8fdb6`; `origin/main` matched that tip,
      with no mainline additions or deletions to integrate.
- [x] Specify polling, state/version identity, atomic adoption, races, failure
      recovery, explicit Refresh continuation, and acceptance scenarios.
- [x] Add this plan to the active index and link the approved target from the
      current runtime/comparison/watch documentation and README.

This initial delivery changes Markdown only. Validate formatting, relative
links, and the diff; the repository's documentation-only exemption applies to
`cargo xtask check`. Commit/push the planning documents and run the required
post-push review. Later implementation uses the full gate in Milestone 7.

## Milestone 2: Centralize comparison state

Backend work. Existing serving remains functional while all baseline consumers
adopt the same captured context and versioned catalogue snapshot.

- [ ] Add failing unit regressions for differing baseline reads, baseline-only
      removed-row changes, unavailable versus empty state, and late results.
- [ ] Introduce typed Git observation, comparison context, complete catalogue
      snapshot, and an injected coordinator; keep modules around 200–300 lines.
- [ ] Resolve one baseline from captured commit ids and pass it explicitly to
      route detection, removed-screen calculation, and comparison generation.
- [ ] Extend typed IPC with complete snapshots, adoption acknowledgement, and
      correlated synchronization requests; retain one parent version authority.
- [ ] Replace child catalogue/routes/id redirects and comparison context before
      emitting an update; protect current entries from removed-entry collisions.
- [ ] Use a direct adapter for the same coordinator in `--no-watch`; share state
      policy instead of duplicating watched/non-watched implementations.
- [ ] Cover pending-request cancellation on replacement/disconnect/shutdown and
      monotonic versions across restart. Run focused tests and `npm run build`.

## Milestone 3: Observe and reconcile Git changes

Backend work. Watched Serve picks up relevant local Git updates automatically
without requiring an authored edit, a child restart, or snapshot generation.

- [ ] Add failing real-Git regressions for ref-only base movement, a paused merge
      followed by its commit, detached HEAD, and changes from another worktree.
- [ ] Add the non-overlapping 1,000 ms Git observer with injectable clock/runner,
      five-second subprocess bounds, reaping, and no network mutations.
- [ ] Handle packed refs, configured refs/commit ids, unavailable refs, recovery,
      and shared-worktree ref storage through Git's own resolution.
- [ ] Feed observations into startup buffering and the existing serial action
      queue; retain Git reconciliation when coalescing with stronger actions.
- [ ] Track config/workspace revisions, including dependency and asset updates;
      validate HEAD-driven workspace changes before suppressing an update.
- [ ] Keep unchanged effective states quiet: no reload for unrelated base
      advances, ordinary commits with identical results, or repeated failures.
- [ ] Retarget only after successful config adoption and preserve CLI `--base`;
      cancel old probes on reconfiguration, failed startup, and shutdown.
- [ ] Recheck refs/revisions before adoption, bound superseded attempts, and
      exercise races with source rebuilds, child exits, and observer cleanup.
- [ ] Run focused tests/build and smoke-test ref-only updates on a live server,
      asserting correct Changes/count, stable port/child, and no lazy generation.

## Milestone 4: Coordinate comparison requests and generations

Backend work. Both serving modes synchronize comparison requests with catalogue
state and return generation results associated with the adopted version.

- [ ] Add failing request tests for stale cache reuse, independent manual-refresh
      baselines, changes during generation, and expired child synchronization.
- [ ] Route stable JSON demand and `?refresh=1` through the coordinator; Refresh
      must update Changes and removed metadata before forcing fresh snapshots.
- [ ] Include the adopted `X-Mokabook-Catalogue-Version` on final development
      JSON responses, including failures, without changing public artifact JSON.
- [ ] Associate generations with config/workspace/baseline state, verify captures
      before accepting results, and prevent old work from satisfying new state.
- [ ] Preserve coalescing, demand-versus-refresh queueing, immutable old panes,
      output validation, bounded retry, failure rollback, and shutdown draining.
- [ ] Verify local `--no-watch` synchronization creates no observer; keep static
      publishing and published Refresh fixed to their built artifacts.
- [ ] Run focused HTTP/generation tests, package build, and a server smoke test.

## Milestone 5: Document the refreshed comparison in mockups

Tags: mockup

Update the existing design catalogue before implementing browser continuation.
The finished mockups show the same controls with a consistent count and view.

- [ ] Inspect/reuse owning screens in
      `examples/basic/entries/design/changes_screens.tsx`, outcome/impact screens,
      and shared design parts before adding a reusable screen variant.
- [ ] Show a screen dropping out of Changes after main incorporates its commit,
      while explicit Refresh retains the selected comparison for its All route.
- [ ] Include mobile and desktop variants, existing loading/failure states, and
      normal navigation links; keep engineering notes outside rendered screens.
- [ ] Keep each screen reusable and each owning page at most five screens;
      any linked flow must import and link back to existing owning screens.
- [ ] Rebuild through `npm run example:build`, commit matching generated HTML
      at delivery, run `npm run example:check` and relevant design tests/types,
      and visually inspect every changed page directly from disk.

## Milestone 6: Continue explicit Refresh after catalogue updates

Tags: ui

Integrate the completed backend into existing browser controls. Automatic
reloads keep their Current behavior; an explicit pending Refresh continues once.

- [ ] Add failing browser/client regressions for new comparison versus old
      sidebar, response/event ordering, navigation cancellation, and retry.
- [ ] Extend existing diff and reload-recovery components with typed pending
      refresh intent, scoped to the exact URL, screen, version, and selections.
- [ ] Consume intent once after automatic reload, request the adopted generation,
      and preserve mode/viewport/theme without forcing duplicate generation.
- [ ] Clear intent on navigation/Current/cancel; reject malformed or stale
      recovery, handle unavailable storage, and prevent Back/manual reload replay.
- [ ] Retain screens that leave Changes but exist in All; use the normal missing
      route when neither catalogue side owns the screen. Keep retry usable.
- [ ] Preserve lazy generation and existing sandbox, filter/disclosure, scroll,
      details, responsive navigation, and dark/mobile/desktop behavior.
- [ ] Run focused client/Chromium tests and smoke both viewport variants against
      real ref updates, including a refresh that becomes unchanged.

If backend work is discovered missing here, follow the repository rule: create
a new backend milestone immediately after this milestone, then a new tagged UI
milestone after it, moving only the blocked incomplete UI TODOs there.

## Milestone 7: Validate the complete behavior and update documentation

Prove the full acceptance matrix and prepare a functioning, reviewable package.

- [ ] Exercise every acceptance scenario in the refresh protocol using fake
      boundary tests, disposable Git repositories/worktrees, HTTP, and Chromium.
- [ ] Assert actual baseline SHAs, rows/counts/removed redirects, snapshot URLs,
      zero automatic generation, no unnecessary reloads, and bounded cleanup.
- [ ] Smoke start/merge/rebase/ref-update/Refresh/shutdown on the development
      server; validate `--no-watch`, packed consumers, and published comparisons.
- [ ] Update README and related protocol wording to delivered behavior, remove
      superseded limitation notes, and keep mockup behavior aligned.
- [ ] Run relevant tests, `npm run build`, formatting/lint/typechecking, and
      `cargo xtask check` with 100% passing results. The gate includes clippy;
      run Rust formatting checks explicitly if any Rust code changes.
- [ ] If checks fail, fix compilation/runtime failures and rerun affected checks
      and the full gate before proceeding to delivery.

## Milestone 8: Commit, push, and review

Deliver all implementation, tests, protocol, mockup source, and generated files
only after Milestone 7 passes.

- [ ] Fetch main and audit its additions from the captured source tip before any
      integration; preserve mainline features and resolve conflicts path by path.
- [ ] Inspect the diff and deletions against `origin/main`, then `git add -A`
      so every new file is included.
- [ ] Commit using Conventional Commits with a title at most 50 characters and
      an explanatory body; inspect the committed diff and push the branch.
- [ ] Run `cargo xtask review` after the push against `origin/main`.
- [ ] Report every finding with a number, severity, context, impact of doing
      nothing, lettered solution options, recommended option, and whether a
      shared rule/test/abstraction should prevent recurrence. Do not auto-fix.
- [ ] Record review disposition; when implementation and delivery are complete,
      move this plan's link from Active to Completed and commit/push any final
      documentation record under the documentation-only validation rules.
