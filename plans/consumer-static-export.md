# Consumer Static Export

Validation: all 429 unit/integration tests and 86 browser tests passed.
Packed local ESM, NodeNext, clean-cache npx, Accounting, and Juno consumers
passed. Markdown formatting, local links, lint, and typechecking passed.

## Objective And Status

Implementation delivered; final verification and review in progress. Add a supported consumer CLI
that exports the complete Mokabook catalogue and comparisons into a directory
the consumer can deploy through their own hosting workflow.

Implement the [consumer export protocol](../docs/protocol/mokabook-export.md)
and [static delivery protocol](../docs/protocol/mokabook-export-delivery.md).
Those documents describe the implemented contract on this branch, not a new npm release.

Consumer invocation:

```bash
npx mokabook export --out .context/mokabook-site
```

Export builds the consumer's current mockups, packages the same Browse shell
and Git comparisons as development, and exits. It does not upload a site or
publish npm packages. A relative output path is config-relative; `--base`
overrides `review.base`. The first release requires a valid Git baseline and
supports hosting at an origin root, with ordinary static files and directory
indexes. Subpath hosting and Git-free/optional comparisons are separate work.

## Initial Code And Design Decisions

- `src/cli/arguments.ts`, `help.ts`, and `run.ts` support only build/check/serve.
  `build` writes fragments and a manifest, not the catalogue shell.
- `scripts/preview/build.mjs` hardcodes the example config. `catalogue.mjs`
  captures shell pages/resources and replaces owned output; `comparisons.mjs`
  captures one isolated comparison. Both comparison selection and preview
  attribution hardcode `origin/main`.
- Preview rewrites HTML URLs for Cloudflare and emits `_redirects`/`_headers`.
  The new core must also work on a static server that ignores these files.
- `src/client/frame_navigation.ts` builds `/id/<id>` URLs; `diffs.ts` fetches
  the stable comparison endpoint. Static delivery needs explicit canonical
  route resolution and a direct immutable comparison URL.
- Reuse `src/build`, `src/server` rendering, `src/browse/document_adapter.ts`,
  and `src/review`; do not create another screen renderer or comparison engine.
- Existing `tests/preview*.test.ts`, `tests/browser/preview*.spec.ts`, and
  `scripts/package/consumer_cases.mjs` are the verification starting points.

Static aliases render existing screen components, and delivery metadata is
invisible. No new screen, appearance, or user-facing interaction is planned.
Reuse the approved [shell design](../docs/protocol/mokabook-shell-design.md)
and its owning mobile/desktop example screens for visual smoke tests. If a
visible change becomes necessary, add a separate mockup milestone before its
tagged UI milestone and update the owning mockups before implementation.

Each implementation milestone ends with a functioning existing product and
passing focused tests. Keep the CLI unavailable until its complete static
browser behavior is ready. Add newly discovered work to the appropriate
incomplete milestone; never reopen completed milestones. Follow the repo's
separate-backend-then-new-UI rule if client work discovers a missing backend
contract. Test discovered regressions before fixing them.

Implementation clarification: the existing registry rejects empty definitions
and empty collections, so the planned "empty valid catalogue" case does not
exist. Preserve Build/Check/Serve validation; export rejects an empty registry
and retains the previous site. Supporting empty catalogues across commands is
a separate product decision, raised with the user. Protocols and regression
tests now describe the existing validation accurately.

## Milestone 1: Define The Consumer Contract — completed

Specify the public command and complete artifact/delivery behavior before code.

- [x] Audit the current CLI, exporter, config, comparison, and browser seams.
- [x] Fetch `origin/main` and audit preservation from source tip
      `e47524b9cb23f1866cb4b1a6a45ebb624b52a300`; main and this branch matched,
      with a clean worktree and no incoming additions or existing diff.
- [x] Define CLI/config rules, Git prerequisites, input consistency, private
      comparison storage, output ownership/rollback, and public-file boundaries.
- [x] Define portable routes, static aliases, delivery metadata, immutable
      comparison loading, hosting requirements, and the test contract.
- [x] Link the planned protocols from the protocol index and relevant current
      docs, without documenting the future command as already implemented.
- [x] Create this plan and register it immediately in `plans/README.md`.

Initial plan delivery uses the repository's documentation-only exception:
validate changed Markdown and local links, inspect the diff, then commit/push
the docs before `cargo xtask review`. Report findings without implementing them.
The implementation milestones below remain incomplete after that docs delivery.

## Milestone 2: Implement The Shared Export Engine — completed

Deliver a tested internal engine while existing consumer commands and the
repository preview remain functional. Do not expose a partial export command.

- [x] Add typed export options, results, versioned ownership data, and static
      delivery descriptors under `src/export`; keep files near 200 lines and
      split coherent responsibilities before 300 lines.
- [x] Implement config-relative output resolution and lexical/real-path
      confinement. Test missing/empty output, config/renderer/source overlap,
      installed-package/dependency/Git paths, symlink parents, and malformed
      ownership inventories before any replacement is allowed.
- [x] Implement one-writer ownership, exact stage/backup paths, safe replacement,
      rollback, explicit stale-reservation recovery, and cancellation/drain
      behavior. Cover installation and cleanup failures with injected boundaries
      plus real-filesystem integration tests.
- [x] Reuse the normal build transaction; pin one Git baseline and capture
      consistent current inputs for both route attribution and comparisons.
      Reject missing history and detected mid-export edits explicitly.
- [x] Preserve distinct Changes attribution and comparison materiality. Apply
      export, transaction, and real-path exclusions to both and extend Watch's
      owned-output pruning without suppressing unrelated authored files.
- [x] Generate the complete route/resource inventory through existing shell,
      catalogue, and Browse-adaptation functions. Detect duplicate/prefix path
      collisions and preserve current-id precedence for removed/renamed screens.
- [x] Package the complete browser module/font graph and public consumer asset
      graph. Test transitive HTML/CSS resources, binary assets, exclusions,
      symlink refusal, missing local assets, and retained external URLs.
- [x] Generate isolated comparisons with unchanged schema-v2 JSON and snapshot
      documents. Never use or disturb a live server's comparison directory.
- [x] Provide a typed static rendering context for the next milestone, including
      canonical/id routes and the direct generation URL; keep default served
      rendering behavior unchanged.
- [x] Run focused engine/config/review/watch/transaction tests and `npm run build`.

Exit: the internal engine can assemble and validate complete site inputs and
resources; the established public product remains available and tested.

Validation: 54 focused export, config, review, Changes, and watch tests passed;
`npm run build`, `npm run typecheck`, and `npm run lint` also passed.

## Milestone 3: Support Portable Static Browser Delivery — completed

Tags: ui

Make the existing shell and client work from plain static files, preserving the
approved appearance and all served navigation/comparison behavior.

- [x] Render and safely parse versioned shell-owned delivery metadata. Missing
      static metadata must not silently fall back to development endpoints;
      malformed data must not create cross-origin or out-of-prefix navigation.
- [x] Use a shared delivery-aware target resolver for shell links and every
      trusted frame activation mode. Preserve exact exported HTML paths and the
      existing served `/id` redirect path in development.
- [x] Render full canonical content for static id aliases. Normalize enhanced
      alias history without extra requests, preserve the validated fragment,
      and retain real page content when JavaScript is disabled.
- [x] Select the direct immutable comparison URL in static mode. Keep lazy
      loading, relative snapshot resolution, retry/refresh, cancellation, missing
      sides, and the server's current stable endpoint behavior intact.
- [x] Remove the watcher connection from static shells, with no environment
      badges or copy changes. Keep both viewports, schemes, search, tags, Changes,
      details, flows, active-tree state, and history/scroll behavior.
- [x] Add focused client/rendering tests and browser tests against exact static
      files and directory indexes, with no rewrite rules or live Mokabook routes.
- [x] Visually smoke-test the existing mobile/desktop owning screens in Current
      and all comparison modes, including alias/deep-link and fragment entry.
      Retain baseline served browser tests.

Exit: internally generated sites provide the complete existing experience on a
basic static server, and ordinary development Browse remains fully functional.

Validation: 59 focused client/navigation tests and 15 static/served browser tests
passed. Inspected mobile/desktop screenshots of Current and every comparison
mode; used browser-suite screenshots after interactive Browser setup failed.

## Milestone 4: Expose The CLI And Adopt It Internally — completed

Deliver the supported consumer command and reuse the engine for the existing
repository preview without changing its deployment ownership or public URLs.

- [x] Extend parser/help/dispatch with `export`, required `--out`, `--config`,
      and optional `--base`. Test wrong-command options, no-argument/default
      behavior, unknown flags, missing values, and config-free help.
- [x] Wire the complete export operation through typed errors and accurate
      success/failure output. Verify build-then-export behavior and document the
      separate build/output transaction guarantees.
- [x] Add CLI integration fixtures with config discovery from nested working
      directories, explicit nested configs, absolute/confined output, custom
      React renderers, cross-platform module resolution, and legacy pages.
- [x] Exercise non-default configured bases, overrides, equal-head baselines,
      missing refs/history, empty catalogues, removed screens, reused ids,
      ignored-only changes, and unchanged/shared-impact screens.
- [x] Turn repository preview entrypoints into adapters over the shared engine;
      retain their files, command, output path, local `--out` behavior, existing
      public assets/routes, and Cloudflare alias/header metadata.
- [x] Add explicit legacy-marker migration in the repository adapter only.
      Verify rollback from both an existing owned preview and a fresh directory;
      do not teach the public command to overwrite legacy/unrelated directories.
- [x] Keep preview adapter transformations inside the staged transaction.
      Audit parity against main before replacing old logic; retain production
      and PR deployment aliases, security settings, cleanup, and existing tests.
- [x] Prove provider alias validation, explicit legacy migration, output-parent
      retarget rejection, and post-install cleanup diagnostics with regression
      tests while integrating the new CLI and repository adapter.
- [x] Run CLI/preview integration suites, build the package, and run the real
      example through `npm run preview:build` and the Cloudflare local runtime.

Exit: a consumer can invoke the public CLI to export a complete site, and the
repository's established preview workflow uses the same tested core.

Validation: CLI, migration, safety, and comparison cases passed; the packed
Accounting/Juno fixtures cover custom renderers, module resolution, and legacy
pages. All 8 existing Cloudflare browser checks and preview builds passed.

## Milestone 5: Prove Consumer Publishing And Document It

Verify the npm boundary and deployment artifact, and publish accurate usage
documentation without actually uploading a site or releasing a package.

- [ ] Add a clean packed-consumer export case using the installed CLI only.
      Cover local dependency and clean-cache npx execution, an explicit custom
      config/base, and absence of this repository's scripts or example files.
- [ ] Inspect the tarball for the new compiled modules/assets and the existing
      package/license allowlist; export must need no consumer deep imports.
- [ ] Copy just the completed site to an isolated serving directory and remove
      the fixture's source/Git access before browser checks. Crawl local route,
      module, CSS, image/font, alias, and snapshot references and require success.
- [ ] Assert no comparison requests in Current and no live-update/network
      dependency on a Mokabook server. Exercise comparisons after source removal,
      refresh, interrupted navigation, failure/retry, and all schemes/viewports.
- [ ] Retain real Cloudflare compatibility checks as a second serving mode;
      do not replace portable-host checks with provider-only success.
- [ ] Update the root README's command table, consumer export/deploy recipe,
      config-relative output example, Git-history requirement, root-hosting
      limitation, external-resource caveat, and troubleshooting.
- [ ] Update example/preview docs, package/runtime/navigation/Changes protocols,
      package architecture boundaries, and release/CI docs together. Mark the
      planned contracts implemented only once the command and tests are complete.
- [ ] Run relevant package, consumer, static/browser, and preview tests with a
      100% pass rate and include them in `cargo xtask check`'s existing suites.

Exit: the shipped package exports real independent consumers, and a separately
served artifact demonstrates the documented publishing workflow.

## Milestone 6: Final Checks, Commit, Push, And Review

Deliver all implementation, generated fixtures, and documentation through the
required repository workflow; no deployment or npm release is part of this plan.

- [x] Run `cargo xtask check` after all relevant tests pass. Resolve failures
      and rerun affected checks; keep implementation complete and functioning.
- [x] Fetch main and audit its additions from a captured source tip before any
      integration. Resolve paths individually; preserve mainline features.
- [x] Inspect the complete diff and deletions against `origin/main`; confirm
      every new source/test/generated file belongs to the intended change.
- [ ] After checks pass, run `git add -A`, commit all completed work using
      Conventional Commits with a title of at most 50 characters and a body,
      then push the existing branch. Do not rename the branch.
- [ ] Inspect committed paths/deletions against `origin/main` and run
      `cargo xtask review` only after the push so new files enter the review.
- [ ] Report every finding without automatically fixing it: number, severity,
      feature/code context, impact of doing nothing, lettered options, and a
      clear recommendation, considering broader prevention as well as a direct
      fix. Record review execution blockers accurately if it cannot finish.
- [ ] Record validation/review outcomes, mark completed milestones, and move
      this plan to Completed in `plans/README.md` once delivery is complete.
      Validate and commit/push any final documentation bookkeeping separately.

Exit: the requested implementation is checked, committed, pushed, and reviewed;
any reviewer-proposed follow-up remains the user's decision.

Preservation audit: fetched main from source tip
`59ca3ac3dd86c86a4474e5ecbf022d5779bbc0e0`; main remains
`e47524b9cb23f1866cb4b1a6a45ebb624b52a300`, with no incoming additions or file
deletions. Preview capture logic is replaced by the planned shared engine;
entrypoints, existing behavior/tests, and deployment workflows are retained.

Final gate: `cargo xtask check` passed formatting, lint, typechecking, all 429
unit/integration tests, committed example verification, package/license checks,
packed consumers, all 86 browser tests, Rust formatting/Clippy, 3 Rust tests,
and the Rust file-length audit. No npm release or deployment was performed.
