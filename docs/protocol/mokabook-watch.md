# Watched Catalogue Development

`mokabook serve` watches by default; `--no-watch` serves one deterministic
snapshot. Every catalogue shell loads the package-owned browser client, which connects to
the versioned event stream and reloads its current durable URL after a higher
version arrives. Snapshot panes do not run this client. Watch classification
derives only from resolved config:

- the discovered or explicit config file reloads configuration, generated
  output, watch targets, and the child;
- entry/page/renderer inputs rebuild generated output;
- an input shared with shell metadata rebuilds before restarting the child;
- configured CSS/fonts/images reload the browser without rebuilding;
- header-proven generated output plus `.git`, `.context`, `node_modules`,
  `dist`, `target`, coverage, browser-test output, comparison output, and Mokabook
  transaction trees are pruned from broad watches and classify as ignored;
- additional inputs use the explicit action declared in config.

Configured source roots and modules remain rebuild inputs even when intentionally
nested beneath an ordinarily ignored directory. Configured stylesheet files
remain reload inputs. Those package-owned classifications take precedence over
additional watch rules. Package source under `node_modules` or an npx cache is
never treated as consumer source. Development of Mokabook itself uses repository
tooling rather than a hidden consumer-specific self-reload path.
An unowned public HTML file beneath `mockupsDir` is an authored static input,
not generated merely because of its extension, so an explicit rule may reload,
restart, rebuild, or ignore it.

Watchers become ready before initial generation begins. Notifications during
generation and child startup are buffered. A child validates the catalogue and binds before
readiness. Initial startup tries a requested concrete port and then each higher
port in order when the address is occupied; port `0` delegates selection to the
operating system. The resolved port remains stable across child restarts, which
bind strictly rather than changing the published URL. Exhausting the valid port
range or encountering another bind error exits non-zero without leaking
watchers. An unexpected child failure after readiness reports its diagnostic,
clears the dead process, and enqueues a restart through the same serialized
action queue used for authored changes.

On a config-file change, the parent first loads and validates the candidate,
starts a replacement watcher and waits for readiness, then transactionally
builds the candidate output. Only after those steps succeed does it adopt the
new resolved config, close the old watcher, and restart the child. A load,
watcher-readiness, or candidate-build failure closes the candidate watcher and
retains the previous config, watcher, output, and child. An explicit CLI
`--base` remains pinned; without one, the restarted child uses the newly loaded
config's comparison base.

Rebuilds are debounced and transactional. A failed rebuild keeps the last-good
server and output, reports the error, and waits for another authored change. A
successful rebuild or healthy restart publishes a new update version. Browsers
reload their current durable URL and restore search, changed-only selection,
current collection disclosure, the disclosure baseline captured before active
filtering, details disclosure, viewport and color-scheme selection, responsive
drawer, catalogue scroll, and per-region stage scroll once. Recovery is strictly
parsed with one compatibility rule: a payload from before filter-baseline
capture treats that missing baseline as unavailable while restoring its other
valid state. Browse applies durable preferences and initial active-route
selection before one-shot recovery. It then re-establishes active-route
visibility, promoting a recovered pre-filter baseline only when a closed
ancestor must be opened. A non-null baseline without active search or Changes
filtering is invalid. Recovery applies only when its durable URL exactly matches
the reloaded page and is removed before application; a later manual refresh
cannot resurrect stale state.

When an authored rebuild reparents an entry, the new manifest relationships
move its navigation row and ancestor crumbs in the same reload. Disclosure
recovery still applies to every unchanged stable collection id; removed ids and
obsolete label-path keys have no target and are ignored.

When a successful rebuild leaves the manifest structure unchanged, or an
explicit watch rule requests a reload, the parent keeps the ready child and
recomputes the complete optional changed-route snapshot. One typed update
message replaces the child's shell snapshot before the event-stream version is
published. An available empty list keeps the filter visible at zero; an
unavailable comparison removes it. The following browser reload therefore
observes Changes rows and counts from the same successful watch action without
requiring a child restart.

Watch actions execute serially. Changes received during an active action are
coalesced by impact before the next action starts, so two rebuilds cannot race
to replace generated output or restart the same child. The parent assigns a
monotonic integer update version to each child and asset reload. Every served
catalogue shell carries the update version captured when its request began. The client
seeds its page baseline from that stamp: an equal event-stream `ready` version
is a no-op, while a higher `ready` version or `update` event triggers one reload
and one-shot state recovery. A document without a valid stamp retains
compatibility behavior in which its first `ready` version establishes the
baseline.

Publishing an update without restarting the child marks its cached comparison
stale before notifying browsers. Reload restores Current, so comparison work
waits for another explicit diff selection. Concurrent comparison requests reuse
one regeneration and snapshots remain pinned to their immutable generation.

Shutdown first stops queued work and waits for any active configuration
transaction, then closes the final adopted watcher, timers, child processes,
HTTP servers, event streams, and ports. A candidate watcher is discarded if
shutdown begins before adoption: shutdown interrupts an outstanding candidate
readiness wait and closes that watcher before the action queue finishes
draining. No later child restart is started. Tests must prove no orphan process
remains after normal shutdown, failed startup, or interruption. The child also
runs the same idempotent server close when its parent IPC channel disconnects,
so an abruptly terminated parent cannot leave a listening orphan. Parent-driven
shutdown first requests graceful IPC closure, then sends SIGTERM and SIGKILL at
bounded intervals when necessary; the supervisor does not finish closing until
the child exit notification arrives.

## Approved Follow-Up

The current watcher does not observe Git refs. A ref-only update, including a
merge's final commit after a watched rebuild, can leave the Changes list and
comparison cache stale. [Git comparison state](./mokabook-comparison-state.md)
specifies an approved, not-yet-implemented observer and coordinated update path.
It retains the authored watcher's `.git` exclusion and replaces independent
baseline reads with complete versioned catalogue state. The
[refresh lifecycle](./mokabook-comparison-refresh.md) specifies the narrow
explicit-Refresh continuation exception to ordinary Current-mode reloads.

See [the catalogue runtime](./mokabook-runtime.md) and [Changes](./mokabook-changes.md).
