# Watched Child Lifecycle Review Follow-Up

The user authorized recommendation B from
[review 7](./catalogue-inputs-and-aliases.md#review-after-bdded01): fix failed-child
cleanup with shared lifecycle state. The repeated nested-page attribution
finding remains invalid; its compiled reproduction needs no production change.

## Fix And Contract

1. **High — failed-child cleanup. Fixed, option B.** Previously, the supervisor
   cleared its handle after readiness failure or a post-ready error and sent
   only SIGTERM. A surviving child could outlive `close()` and retain its port.
   [ManagedChild](../../src/server/child_lifecycle.ts) now owns readiness,
   terminal state, and one cleanup operation per child. All failure, shutdown,
   and replacement paths retain ownership until that operation completes.
   Concurrent callers share its timers and terminal confirmation, and the first
   startup error remains the reported failure. Late ready messages are ignored.
   [Native handles](../../src/server/child_process.ts) retain terminal results
   for late subscribers, including failed process creation. Graceful-send errors
   do not bypass escalation. The
   [supervisor](../../src/server/supervisor.ts) rejects a new start while cleanup
   still owns the child and preserves resolved ports across successful restarts.
   This is broader than calling the old shutdown helper from additional catches:
   that helper could miss a prior exit and let competing callers return early.

The [watch contract](../protocol/mokabook-watch.md) and README document the shared
cleanup rules. The changes preserve the 15-second readiness timeout and existing
graceful/SIGTERM/SIGKILL intervals; they add no consumer configuration.

## Mainline Integration

Before merging, the source tip was `2377b01`, main was `aa5adea`, and their merge
base was `a5ecbc0`. The audit retained main's copy/expand/collapse icons,
URL-only clipboard handling, browser and shell tests, and settled watch helpers
and tests. The icon conflict keeps all main additions plus current page wording.
Conflicting generated HTML was regenerated through the normal example build
from combined sources. No mainline feature was discarded or bulk-selected.

## Verification And Delivery

Nine deterministic lifecycle regressions were added first; eight failed on the
previous implementation. The focused lifecycle/watch suite then passed all 20
tests. A separate real-process smoke passed, verifying forced termination and safe port
reuse after a transport error while the child ignores graceful shutdown and
SIGTERM, including late terminal subscription and a successful replacement HTTP
request on the original port.

The full `cargo xtask check` passed: 606 Node tests, 106 Chromium tests, and
3 Rust tests, plus formatting, ESLint, typechecking, example freshness (70 files),
package checks, packed-consumer smokes, clippy, and the Rust file-length audit
(10 files). Browser coverage includes the integrated copy/expand controls and
watched-server shutdown. Documentation checks validated 199 local targets across
26 changed Markdown files. Logs are retained under
`.context/review-followup-5-{red,focused,process-smoke,check}.log`.

The mainline diff audit found only the three previously approved deletions;
there are no new removals. Delivery requires committing and pushing the checked
fix before post-push review 8/10. New findings are reported for user selection,
as required by the repository's review rule.

## IPC Disconnect Follow-Up

Fix `453b0bd` was pushed before review 8/10. That review reported one new
**Medium** finding: the native handle ignored IPC disconnection while a surviving
child silently missed reload updates. Real-process probes confirmed it on the
checked commit and pinned main `aa5adea`. Normal children already self-close on
disconnect; the gap concerns a process that remains alive. The user authorized
the recommended lifecycle fix.

Options were **A.** Observe disconnection and route it through shared cleanup,
**B.** Throw on the next disconnected send, or **C.** Keep relying on process
completion. **Recommended and applied: A.** Unlike B, it detects loss without
another authored change. The native handle retains disconnection for late
subscribers, and the lifecycle treats it as a failure while waiting or serving.
Shutdown and post-exit disconnections are ignored. Ownership remains with the
child until terminal confirmation; startup preserves any earlier diagnostic,
and recovery cannot spawn a replacement while the failed child remains alive.

Six deterministic cases and one real-process regression were added before the
fix; five failed and two controls passed. All 28 focused lifecycle/watch tests
then passed. The real-process test closes IPC from a live HTTP child that ignores
SIGTERM, verifies force-kill before same-port replacement, and proves the
replacement receives updates. Normal parent-loss shutdown and the independent
ENOENT/EPIPE spawn-failure probe also passed. The full `cargo xtask check` passed
with 613 Node, 106 Chromium and 3 Rust tests, formatting, ESLint, typechecking,
70 current example files, package checks and packed consumers, clippy, and the
Rust file-length audit (10 files). Documentation validation passed for 201 local
targets across 27 changed files. The checked fix is ready for commit/push followed
by post-push review 9/10.

The mainline audit captured source `453b0bd`, main `a0e349a`, and merge base
`aa5adea` before this follow-up. Main's new consumer static-export feature is
outside this focused IPC fix and remains unmerged. This patch adds no removals
to the authored branch diff. New review findings remain for user selection.
