# Comparison Refresh Lifecycle

## Delivery Status

Approved target; not implemented. This is the request/browser half of
[Git comparison state](./mokabook-comparison-state.md), delivered through the
[Git comparison refresh plan](../../plans/git-comparison-refresh.md).
Existing [Changes](./mokabook-changes.md) and [watching](./mokabook-watch.md)
behavior remains the current implementation until the plan lands.

## Requests And Cache Freshness

Every development request to the stable comparison JSON endpoint synchronizes
with the coordinator before deciding whether to reuse a generation. Explicit
Refresh/retry retains `/__mokabook/diffs/review.json?refresh=1`: it runs the same
synchronization, including Changes/count and removed-screen metadata, then
forces a fresh generation. Requests for immutable pane files retain their
existing retention semantics and do not initiate Git probing or regeneration.
Validate context again when serving generation JSON after a redirect; a ref
change between those requests must not turn an obsolete result into current.

Perform generated-output validation before accepting a new current comparison.
Pass the coordinator's captured baseline to comparison generation. Concurrent
requests for the same effective state share work; a force refresh that arrives
during demand generation queues the required subsequent generation as today.
If state moves, the earlier result cannot satisfy a request for the newer state.
Generation failure preserves retained files for existing panes and offers retry.

Development JSON responses carry `X-Mokabook-Catalogue-Version` with the adopted
monotonic version. Put it on the final JSON response, including a failure with
an adopted state, not just a redirect. This is private serving metadata; static
artifacts and the public `review.json` schema remain unchanged. A client must
not display a comparison whose version predates its adopted shell version.

Background reconciliation, browsing, search, Changes filtering, viewport/theme
changes while in Current, and normal reloads never initiate snapshot generation.
Only an explicit diff selection or continuation of a user's pending Refresh
does so. Publishing still generates once while creating its artifact; published
Refresh reads that artifact and never uses the development observer or IPC.

## Browser Behavior

Automatic Git updates use the existing versioned reload/recovery behavior:
restore the durable URL, search/filter, collection disclosures, details,
viewport/theme, drawer, and scroll state, and return to Current. Main advancing
without an effective state change produces no reload or comparison generation.

An explicit Refresh that finds the same catalogue state stays in the selected
comparison mode and updates its snapshots. If synchronization changes catalogue
state, reload the shell through the same update mechanism so navigation, count,
removed pages, and comparison use the new version. Continue the user's explicit
comparison request once after that automatic reload, preserving mode, viewport,
color scheme, screen id, and exact durable URL. This is a narrow exception to
the ordinary rule that navigation and reload return to Current.

Record this pending intent in memory when Refresh/retry starts. Only the
automatic update handler may persist it in one-shot reload recovery, together
with the received version. Consume and delete it before requesting the new
comparison; validate its discriminated mode, viewport/scheme, screen id, URL,
and version using the same strict recovery boundary as existing Browse state.
The loaded shell must be at least that version and still own the same screen.
Use a normal demand request for the continuation so it can share the refreshed
generation; do not force a second generation solely because of the reload.

Navigation, choosing Current, or cancellation clears a pending intent; ordinary
browser reload/Back/Forward must not replay it. Response and event arrival order
must not cause duplicate continuations or let an old response overwrite another
screen. An event for a newer state supersedes any older pending response. If
storage is unavailable, recover safely to Current and permit a new selection.

If the screen leaves Changes but still exists in All, retain its route and
continue its comparison with the updated count. If it no longer exists in
either current or removed catalogue entries, use the existing missing-route
view and discard the intent. A failed comparison leaves the refreshed catalogue
usable and shows existing plain-language retry UI; it does not revive old
Changes rows or label an old baseline current.

Use existing catalogue controls and reusable owning screen components. Update
their mobile and desktop design examples before browser implementation, showing
the count/row transition and the retained explicit comparison. Technical notes
belong outside rendered screens. All snapshots keep the existing sandbox,
viewport/theme, missing-side, and ignored-region behavior.

## Acceptance Scenarios

| Scenario                                                                        | Required result                                                                                           |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Base adds unrelated commits; merge base stays the same                          | No browser update, child restart, or snapshot generation.                                                 |
| Main incorporates a commit already on the branch; only the local base ref moves | Changes/count and baseline advance together without an authored edit.                                     |
| Merge pauses after source changes, then commits with no further source edit     | A final Git observation removes imported main changes from the branch delta.                              |
| Rebase/reset/detached checkout changes HEAD                                     | Reconcile checked workspace output and baseline before publishing.                                        |
| Commit keeps the same effective catalogue and baseline                          | No unnecessary reload or snapshot invalidation.                                                           |
| Another linked worktree changes shared refs, or refs are packed                 | The relevant resolved ref change is observed without recursively watching Git internals.                  |
| Explicit Refresh after refs move                                                | The sidebar, count, removed entries, and comparison agree; resume the same comparison once.               |
| Baseline loses or gains a previously removed screen                             | Rows, route pages, and id redirects update even when the current manifest is identical.                   |
| A source/public-asset update overlaps Git movement                              | Publish checked output and matching evidence; invalidate snapshots even for asset-only changes.           |
| Old state/generation finishes after a newer update                              | It cannot replace current state or serve the newer request; old immutable panes remain valid temporarily. |
| Repository/base/ancestor is unavailable, then recovers                          | Keep current Browse; hide unknown Changes, offer retry, then restore correct available state.             |
| Config/base changes, startup buffering, child exit, or shutdown during a probe  | Preserve last-good adoption, stable ports/versions, and bounded cleanup without orphan work.              |
| `--no-watch` comparison request or static published Refresh                     | Local requests synchronize without timers; published snapshots remain fixed.                              |

Use deterministic unit tests with fake Git/clock/IPC boundaries for scheduling,
coalescing, retries, state identity, and cancellation. Integration tests use
disposable real repositories/worktrees and the actual development server;
browser tests exercise both viewport variants, light/dark selection, filter
state, navigation cancellation, and both response/event arrival orders.
Assert baseline commit ids and rendered rows/counts as well as image sources.
Prove automatic updates and initial browsing do not call comparison generation.
