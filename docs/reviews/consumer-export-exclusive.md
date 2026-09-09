# Consumer Export: Exclusive Destination Follow-Up

The user approved both findings in the
[preceding review](./consumer-export-followup.md). This record tracks their
implementation on [PR #49](https://github.com/futex-ai/mokabook/pull/49), without
reopening completed milestones or authorizing an automatic new-finding cycle.

## Approved Findings

1. **High — Concurrent export destinations could be replaced.** Group:
   filesystem transactions. Independently confirmed: nine new regression
   assertions failed against the previous implementation, including an empty
   destination appearing at the exact stage-install or backup-restore call.
   Initial absence, root identity changes, and a captured replacement were not
   retained as part of transaction authority. Doing nothing could discard a
   late copied export or replace another process's empty directory.

   Options considered: A) retain exact initial identity and share an
   OS-enforced no-replace rename for capture/install/restore; B) add another
   existence check; C) weaken the replacement contract. Recommended and
   implemented: A. The native bridge is an intentional runtime dependency,
   avoiding the remaining check-to-rename race in B and the partial visible
   output of a copy-based workaround. The rest of the exporter remains in
   TypeScript; fixed native signatures and flags live at one narrow boundary.
   Unsupported operations fail closed, and no existing dependency version
   changed. Protocol, README, and required platform CI cover the new contract.

2. **Low — Completed release bootstrap appeared to be current procedure.**
   Group: release docs. Independently confirmed against the package, release
   manifest, and workflow; the drift was already present on main. Doing nothing
   could cause maintainers to repeat bootstrap steps or reset release state.

   Options considered: A) document current release-managed version sources and
   release/retry workflow, retaining bootstrap as completed history; B) add a
   historical label only. Recommended and implemented: A. The documentation
   no longer needs to be edited on every package-version change. Versions,
   release configuration, publication permissions, and workflow behavior are
   unchanged.

## Verification

- Added 16 regressions covering initial inspection, late empty/owned output,
  identity substitution/removal, capture substitution, install and restore
  races, native destination kinds, Unicode paths, invalid native paths, and
  unavailable native support. Nine failure assertions reproduced before the fix.
- All 112 focused export/release tests pass locally on macOS Node 24.2.0.
- Clean Linux Node 22.14.0/npm 11.7.0 passed all 31 native/transaction/recovery
  tests after a normal dependency install, with no consumer compiler step.
- An initial macOS full-gate attempt stopped in the test phase: the repository
  preview correctly rejected changed-path evidence when review notes were added
  during generation, and three watcher starts timed out under heavy host load
  (load average above 298 on 14 CPUs). The unchanged preview tests and all three
  watcher tests passed independently. No deadlines or assertions were relaxed.
- The complete `cargo xtask check` passed against the same source in a frozen
  clean Linux checkout with real Git history: all 594 unit/integration tests,
  105 browser tests, and three Rust tests passed, along with formatting, lint,
  typechecking, generated-example verification, package/license checks, packed
  consumer smoke tests, Rust formatting/Clippy, and the 10-file Rust length audit.
  The first Linux browser attempt lacked the default Google Chrome executable;
  rerunning the complete gate with the installed Chromium browser selected via
  `PLAYWRIGHT_CHANNEL=chromium` passed. No product or test code changed between
  those attempts. Focused required macOS/Windows CI runs follow the push.
- Refetched main remains `a5ecbc06d6169ec4af5329d52b6f13b2cd2f0276`, already
  merged into the branch. No mainline file deletions were found.

## Separate Dependency Audit — Needs Decision

3. **High — Existing dependency advisories remain.** Group: dependency
   maintenance. `npm audit` reports 11 High and one Moderate affected packages;
   the production-only audit reports one High in `brace-expansion@5.0.7`, reached
   through the existing glob dependency. That same locked version exists on
   main, and the native-bridge install changed no existing locked versions.
   Koffi and its platform packages are not flagged in the report.

   Doing nothing retains a reported memory-exhaustion risk for crafted brace
   patterns; the development-tool advisories also need reachability assessment.
   See the upstream [brace expansion advisory](https://github.com/advisories/GHSA-rgw5-rvv9-x895).
   Options: A) perform a focused runtime/tooling dependency update, inspect the
   full audit paths, and rerun the complete gate; B) explicitly accept a bounded
   deferral after assessing exposure. Recommended: A as separately approved
   dependency maintenance. No automatic `npm audit fix` or unrelated upgrades
   were performed. Release docs no longer claim an old override proves a
   currently audit-clean tree.

## Delivery

Commit/push, the required post-push `cargo xtask review`, and CI confirmation
are pending. No npm release or PR merge is part of this follow-up.
