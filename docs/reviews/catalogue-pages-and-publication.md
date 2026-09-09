# Catalogue Pages And Publication Review

## Scope And Outcome

`cargo xtask review` completed on 2026-09-09 after commit `709151a` was
pushed, reviewing the complete committed diff against `origin/main` at
`93ac778`. This was invocation 2 of the maximum 10; invocation 1 was interrupted
after the post-push mainline audit detected new main changes, before any final
findings. The implementation commit is `57eb59a`.

The original route-contract and review-record findings were validated and
resolved before implementation. The final review raised four additional valid
findings. Items 1–3 remain follow-ups for user selection under the repository's
no-automatic-review-fix rule. Item 4 is resolved by the already-required final
documentation bookkeeping. This is a completed review with findings, not a
clean review.

## Findings

1. **High — imports outside `repoRoot` escape the source inventory. Open.**
   [The shared graph classifier](../../src/build/source_inventory.ts) silently
   skips executable inputs outside the repository. Independent probes confirmed
   that an entry helper outside `repoRoot` changes generated HTML without
   changing `sourceFiles`; an outside config helper is also accepted and omitted.
   This breaks the [complete inventory contract](../protocol/mokabook-source-protection.md):
   watch, freshness, and publication consistency checks cannot account for those
   authored inputs. Options: **A.** Reject outside source inputs at the shared
   graph boundary after excluding the package runtime and installed dependencies;
   add config, entry, renderer, and page-helper regressions. **B.** Expand the
   repository root automatically. **C.** Allow and document the omission.
   **Recommend A:** one fail-closed rule protects every graph consumer; B changes
   the ownership boundary implicitly and C leaves the incomplete-inventory bug.

2. **Medium — a symlinked `.context` can publish outside the repository. Open.**
   [Preview output validation](../../scripts/preview/catalogue.mjs) confines
   the output to the resolved context directory without confining that directory
   to the real repository root. A disposable probe successfully published an
   `index.html` outside its configured `repoRoot`. Existing ownership-marker
   checks still protect unowned existing directories, but new output can escape.
   This pre-existing weakness remains after the added nested-symlink checks.
   Options: **A.** Require both resolved `.context` and output to remain within
   the real repository root, retaining ownership and nested-output checks;
   cover context-root and nested-parent symlinks. **B.** Reject all symlinked
   `.context` directories. **C.** Document a non-symlink precondition only.
   **Recommend A:** a shared canonical-root invariant covers ancestor escapes
   while preserving legitimate in-repository symlinks.

3. **Low — common shell copy still describes screens only. Open.**
   [Search accessibility and placeholder text](../../src/server/shell/document.tsx)
   says “Search screens”; [home and missing-route copy](../../src/server/shell/views.tsx)
   omits whole-document pages. Users searching for or opening a document receive
   misleading guidance despite its first-class catalogue support.
   Options: **A.** Use catalogue-wide copy in shared shell controls, update the
   owning mobile/desktop mockups, and update shell/browser assertions. **B.**
   Specialize messages only when an entry kind is known. **C.** Retain screen-only
   labels. **Recommend A, with B where useful:** shared neutral wording prevents
   the same omission when more entry kinds are introduced.

4. **Low — documentation labels still said planned/approved target. Resolved.**
   The [README](../../README.md) and [protocol index](../protocol/README.md)
   contradicted implemented delivery statuses, and the README had a stray space
   before a semicolon. Leaving them unchanged would confuse contributors about
   feature availability. Options: **A.** Update feature labels and correct the
   typo in final bookkeeping. **B.** Keep status only in plan files. **C.** Leave
   stale labels until another edit. **Recommended and applied: A.** The plans
   retain the dated delivery and review history; feature links use stable names.

## Verification And Evidence

The final implementation gate passed: 453 Node tests, 102 Chromium tests,
three Rust tests, formatting, lint, typechecking, package checks, packed
consumers, example freshness, clippy, and Rust file-length checks. The independent
review ran read-only inspection and `git diff --check`; it did not rerun the
build-writing test suite. All 60 design artifacts were visually inspected.

The Accounting rehearsal and its preservation checks are recorded in the
[consumer note](../migration/accounting-page-entries.md). Its compiled package
matches the final runtime. Durable adoption and npm publication remain separate.

Reproductions for findings 1 and 2 use only disposable fixtures and clean them
up afterward. Their script, results, original review output, and verification
logs are retained under `.context`; no original consumer files were changed.
