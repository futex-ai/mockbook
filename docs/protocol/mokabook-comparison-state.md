# Git Comparison State

## Delivery Status

Approved target; not implemented. Delivery is tracked by the
[Git comparison refresh plan](../../plans/git-comparison-refresh.md).
The existing [watch contract](./mokabook-watch.md) describes current serving;
this document specifies the shared state that will replace its independent
baseline reads. [Refresh lifecycle](./mokabook-comparison-refresh.md) defines
the corresponding request, browser, and acceptance behavior.

## Scope And Invariants

One comparison-state coordinator owns the baseline, Changes routes/count,
removed-screen catalogue metadata, and snapshot invalidation for a running
development catalogue. This extends the existing branch-point semantics:
`merge-base(HEAD, configured base)` compared with validated workspace output,
including committed, staged, unstaged, and non-ignored untracked changes.
Existing route projections, ancestry, dependency/shared-impact matching,
ignored-region rules, output exclusions, and immutable snapshots remain intact.

The coordinator never fetches, merges, rebases, stages, or commits. The configured
base defaults to local `origin/main`; an explicit CLI `--base` retains precedence.
An upstream change becomes observable after another actor updates the local ref.
Published catalogues remain fixed artifacts and never run a Git observer.

All state consumers use one captured baseline commit. They must not independently
resolve `HEAD` or the configured base while calculating a published update.
Git changes alone must not restart the server child, change its port, or generate
comparison snapshots. A normal source/config change retains its existing build
and restart behavior.

## Git Observation

Watched Serve samples Git immediately during startup and then 1,000 ms after the
preceding sample settles. Use an injected clock and Git command boundary; only
one probe may run at a time. Bound each subprocess to five seconds, terminate
and reap it on timeout/shutdown, and retry on the next scheduled sample.

Resolve `HEAD` and the configured base to full commit object ids through Git.
Track changes in those ids and in their availability. Ordinary ticks only read
refs; calculate the merge base when an observation changes or a request needs
fresh state. While comparison is unavailable, retry reconciliation on subsequent
samples even if ref ids are unchanged: fetched history or repaired Git access
can restore a common ancestor without moving either tip.
Ref arguments must be passed as arguments, with option termination
and validation, never shell interpolation. Keep successful object ids typed
separately from unavailable/error results.

Use Git's repository resolution instead of assuming `<repoRoot>/.git` contains
loose refs. Support linked worktrees with separate HEADs and shared refs, packed
refs, detached HEAD, and arbitrary configured refs or commit ids. The authored
file watcher must continue pruning `.git`, objects, logs, and package outputs.
An unrelated branch, object write, or reflog update is not a catalogue change.

Probe notifications enter the same serialized work queue as source/config
updates. Coalesce bursts and buffer startup notifications so a change between
the first probe and child readiness is reconciled afterwards. Completing or
aborting a merge/rebase must be detected even when the final operation changes
only Git metadata. An unfinished merge can use the pre-merge HEAD; completion
must cause a final reconciliation without requiring another authored edit.

If only the base tip advances, the merge base is unchanged, and workspace/config
revisions are unchanged, record the observation without invalidating snapshots
or sending a browser update. Ordinary commits with the same effective catalogue
state likewise cause no reload. A HEAD change first validates the current
catalogue inputs/output, even if the merge base is unchanged: checkout/reset
can alter files, and a Git event must not bypass a pending source rebuild.

## Captured State

Use discriminated, fully typed records for available and unavailable comparison
state. An available capture records the configured base, resolved HEAD and base
tip commits, their merge base, the adopted config revision, and the successful
workspace revision. Resolve the merge base using the captured commit ids.
Read the base manifest at that commit once for route and removed-screen
calculation; snapshot readers receive the same commit explicitly.

The workspace revision advances after an adopted generated-output build or
public-asset update. It covers metadata, dependency evidence, and reload-only
resources as well as generated HTML; a baseline hash alone is not a cache key.
A changed HEAD requires validating/reconciling workspace state before reusing a
revision. Reuse the existing generated-output checks and path/ownership rules.

A published snapshot contains one monotonic catalogue version, comparison
availability, baseline identity when available, current manifest, changed
routes, and removed-screen metadata. An available empty route list means zero
changes; unavailable is distinct and hides the Changes filter. Removed screens
come from this baseline and current manifest, with current entries taking
precedence when a route/id is reused. Retire obsolete removed rows, pages, and
redirects when the baseline changes, including when current metadata is identical.

Comparison generations are associated internally with the adopted config,
workspace revision, baseline identity, and catalogue version. A generation
cannot be reused for a different effective state. Preserve the public
`review.json` schema and deterministic bytes: process versions, timestamps,
absolute paths, and observer bookkeeping do not enter the published artifact.

## Ownership And Publication

In watched Serve, the parent owns the coordinator, Git observer, serialization,
and version allocation. It supplies complete typed state to the child through
the existing IPC boundary. The child swaps its catalogue, comparison context,
and changed-route snapshot together, invalidates superseded generations, then
acknowledges adoption and publishes its event-stream version. Polls must not
increment versions independently of this authority.

A child comparison request asks the parent coordinator to synchronize through
correlated typed IPC messages, then uses the adopted context. Pending requests
must reject on child replacement, disconnect, or shutdown rather than waiting
for a response from a retired process. Superseded messages cannot overwrite a
newer child/version. A new child receives the latest complete snapshot before
it reports readiness; the version stays monotonic across restarts.
Foreground synchronization, including queue/adoption waits, has a 30-second
deadline. Expiry returns a retryable failure and retires the pending correlation;
later background adoption may still succeed but cannot resolve an expired call.

In `--no-watch`, the same coordinator runs in the server process through a
direct adapter. It installs no observer timer or authored watcher. Browse stays
at its last adopted snapshot until an explicit comparison request reconciles
Git and checked output. Both modes use the same state calculation and request
rules; avoid separate implementations with different cache semantics.

Source/config adoption and Git reconciliation execute serially. A source action
and a Git notification arriving together produce a state based on the adopted
output, not a partially written build. A stronger queued rebuild must retain
the need to reconcile Git; a failed action must not silently consume it.
Only a changed effective state produces a browser update. Existing versioned
event-stream recovery handles a missed update during initial connection.

## Races And Failures

Re-read the resolved refs and check config/workspace revisions before publishing
calculated state or selecting a completed generation as current. If they differ
from the capture, discard the candidate for current-state use and recalculate.
An old generation may remain available by its immutable URL for in-flight pane
requests, but it cannot satisfy the stable latest-comparison endpoint.
Never allow an older calculation to replace a newer accepted version.

Limit one foreground synchronization/generation request to three superseded
attempts. Continued churn returns the existing retryable comparison failure;
the observer continues on its schedule. These checks detect observed changes;
they do not claim to lock external Git commands or freeze the working tree.
Filesystem changes received during calculation queue another reconciliation.

A missing repository/ref, no common ancestor, or failed/timed-out Git probe
publishes unavailable comparison state when availability changes. Keep current
browsing and the last-good generated output, clear stale Changes and removed
entries, and prevent stale snapshots from being returned as a current result.
An explicit diff request shows the existing failure/retry state. Repeated
identical failures do not repeatedly reload the browser or flood diagnostics.
Successful recovery republishes available state, including a valid zero count.

A failed build or config candidate retains the previous adopted configuration,
output, and watcher. Comparison cannot certify output that fails the generated
checks; retain current browsing and report the existing comparison failure.
The Git observer continues against the adopted config. A valid config adoption
replaces the observed repo/base atomically; stale probes from the old config
cannot publish afterwards. An invalid candidate does not retarget the observer.

Shutdown stops probe scheduling and new queue work, cancels/reaps active probes,
rejects pending IPC synchronization, and drains/cleans generation work through
the existing bounded lifecycle. No timer, subprocess, child, event stream, or
listener may remain. Startup failures and unexpected child exits follow the
same ownership rules; restarting a child cannot create a second observer.
