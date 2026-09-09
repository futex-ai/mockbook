# Catalogue Pages And Publication Review

## Scope And Outcome

`cargo xtask review` completed on 2026-09-09 after commit `709151a` was
pushed, reviewing the complete committed diff against `origin/main` at
`93ac778`. This was invocation 2 of the maximum 10; invocation 1 was interrupted
after the post-push mainline audit detected new main changes, before any final
findings. The implementation commit is `57eb59a`.

The original route-contract and review-record findings were validated and
resolved before implementation. The final review raised four additional valid
findings. Item 4 was resolved by final documentation bookkeeping in `751499e`.
The user subsequently authorized fixes for items 1–3; all three were reproduced
with regression tests and the recommended fixes are implemented. Verification
and the subsequent post-push review are recorded below. The original review
completed with findings.

## Findings

1. **High — imports outside `repoRoot` escape the source inventory. Resolved.**
   [The shared graph classifier](../../src/build/source_inventory.ts) silently
   skipped executable inputs outside the repository. Independent probes confirmed
   that an entry helper outside `repoRoot` changes generated HTML without
   changing `sourceFiles`; an outside config helper is also accepted and omitted.
   This broke the [complete inventory contract](../protocol/mokabook-source-protection.md):
   watch, freshness, and publication consistency checks could not account for those
   authored inputs. Options: **A.** Reject outside source inputs at the shared
   graph boundary after excluding the package runtime and installed dependencies;
   add config, entry, renderer, and page-helper regressions. **B.** Expand the
   repository root automatically. **C.** Allow and document the omission.
   **Recommended and applied: A.** One fail-closed rule protects every graph consumer; B changes
   the ownership boundary implicitly and C leaves the incomplete-inventory bug.
   All non-exempt graph inputs now reach the shared strict repository validator.
   Regression tests cover config, entry, renderer, transformer, page, and raw
   template imports, plus continued support for outside installed dependencies.

2. **Medium — a symlinked `.context` can publish outside the repository. Resolved.**
   [Preview output validation](../../scripts/preview/catalogue.mjs) confined
   the output to the resolved context directory without confining that directory
   to the real repository root. A disposable probe successfully published an
   `index.html` outside its configured `repoRoot`. Existing ownership-marker
   checks protected unowned existing directories, but new output could escape.
   This pre-existing weakness remained after the initial nested-symlink checks.
   Options: **A.** Require both resolved `.context` and output to remain within
   the real repository root, retaining ownership and nested-output checks;
   cover context-root and nested-parent symlinks. **B.** Reject all symlinked
   `.context` directories. **C.** Document a non-symlink precondition only.
   **Recommended and applied: A.** A shared canonical-root invariant covers ancestor escapes
   while preserving legitimate in-repository symlinks.
   Both publication options reject context, parent, and output escapes before
   writes, even for marked output; tests also prove valid in-repository symlinks
   and a symlinked repository root remain supported.

3. **Low — common shell copy still describes screens only. Resolved.**
   [Search accessibility and placeholder text](../../src/server/shell/document.tsx)
   said “Search screens”; [home and missing-route copy](../../src/server/shell/views.tsx)
   omitted whole-document pages. Users searching for or opening a document received
   misleading guidance despite its first-class catalogue support.
   Options: **A.** Use catalogue-wide copy in shared shell controls, update the
   owning mobile/desktop mockups, and update shell/browser assertions. **B.**
   Specialize messages only when an entry kind is known. **C.** Retain screen-only
   labels. **Recommended and applied: A, with B where useful.** Shared neutral wording prevents
   the same omission when more entry kinds are introduced.
   Shared search now names the catalogue; home and missing-route guidance refer
   to an item. Known screen/page messages retain their specific wording. Owning
   designs were updated and regenerated before runtime copy; shell, design,
   publication, and mobile/desktop browser assertions cover the result.

4. **Low — documentation labels still said planned/approved target. Resolved.**
   The [README](../../README.md) and [protocol index](../protocol/README.md)
   contradicted implemented delivery statuses, and the README had a stray space
   before a semicolon. Leaving them unchanged would confuse contributors about
   feature availability. Options: **A.** Update feature labels and correct the
   typo in final bookkeeping. **B.** Keep status only in plan files. **C.** Leave
   stale labels until another edit. **Recommended and applied: A.** The plans
   retain the dated delivery and review history; feature links use stable names.

## Verification And Evidence

The original implementation gate passed: 453 Node tests, 102 Chromium tests,
three Rust tests, formatting, lint, typechecking, package checks, packed
consumers, example freshness, clippy, and Rust file-length checks. The independent
review ran read-only inspection and `git diff --check`; it did not rerun the
build-writing test suite. All 60 design artifacts were visually inspected.

The Accounting rehearsal and its preservation checks are recorded in the
[consumer note](../migration/accounting-page-entries.md). Its compiled package
matched the originally reviewed runtime. That tarball predates these follow-up
fixes; durable adoption must use and validate the chosen package version.
Durable adoption and npm publication remain separate.

Reproductions for findings 1 and 2 use only disposable fixtures and clean them
up afterward. Their script, results, original review output, and verification
logs are retained under `.context`; no original consumer files were changed.

## Authorized Follow-Up

The failing regressions captured all six outside authoring-import cases, the
context-root escape in both publication options, and both responsive design and
runtime copy. Focused verification passed 46 Node tests, 34 browser tests, and
typechecking. The full `cargo xtask check` passed with 469 Node tests, 104
Chromium tests, three Rust tests, formatting, lint, package/packed-consumer
checks, example freshness, clippy, and the Rust file-length audit.

All 52 changed design artifacts were opened directly from disk and visually
inspected, plus the live home, document, and missing-route views at both widths.
All 163 local Markdown link targets resolve. The fresh mainline audit found no
additions beyond `93ac778`; no new deletions were introduced. Logs and visual
evidence are retained under `.context/review-fixes-*`.

The required post-push review follows the fix commit; its result is recorded
after that review completes.
