# Selected live comparisons

Live comparison loading must scale with the selected screen or saved component
variant and its referenced resources. It must not compile the consumer, check
unrelated generated documents, classify the catalogue again, or snapshot other
entries. Build, Check, Export and the complete comparison endpoint retain their
exhaustive behavior.

## Requests and evidence

The live browser requests
`/__mokabook/diffs/review.json?route=<encoded-catalogue-route>`, adding
`variant=<saved-variant-id>` for a component and `refresh=1` for an explicit retry
or refresh. Current, navigation and filtering never request snapshots. Static
delivery continues to request its complete, packaged comparison URL without
selection parameters.
Switching viewport or color scheme reuses the selection's loaded result; it does
not fetch JSON again or restart a pending request. Changing the saved variant
requests its own result and fences responses from the previous selection.

The live server uses the accepted complete manifest and background Changes
snapshot. Background classification retains the pinned branch-point commit,
changed paths, and SHA-256 digests of current generated views and resources it
reads. Those digests are private IPC data, not published comparison fields.
Every current selected document requires a digest. Capturing a known input with
different bytes fails instead of combining old evidence with new output. Missing
or pending evidence produces the existing retryable comparison failure state;
it never falls back to an exhaustive foreground build.

For a component-aware catalogue, project the existing v3 result onto the selected
screen, or the selected component and saved variant. Keep its entry sides, view
states, ignored regions and direct change reasons. Recompute the selected screen
ignored-impact aggregate. Catalogue-wide affected-consumer evidence remains in
the shell inspector; the selected response omits those cross-entry records.
Screen-only catalogues use the same v2 screen comparison policy as complete
comparisons, applied only to the requested route. Both response shapes pass the
existing result validator. Missing entries or variants fail without inventing
comparison records.

## Capture and lifetime

Capture all available viewport/scheme views of the selection and only their
transitive resource closure. Keep original before/after documents unmodified,
with separate route-preserving snapshot roots. Historical reads use the pinned
Git commit and bounded batches of regular files. Current reads retain the public
file and source-confinement rules. Resource hints not read by classification are
validated and captured on demand. Frames retain their script-disabled sandbox.

The stable request redirects to
`/__mokabook/diffs/__generations/selected-<uuid>/review.json`. JSON and snapshot
files belong to that immutable generation, are served with `no-store` and
`nosniff`, and resolve only from its captured file map. These in-memory generations
create no comparison output directories. HEAD returns the same headers without
a body. Unknown paths, traversal, encoded separators and private metadata are
unavailable through this route.

Identical pending selections coalesce. Different selections serialize, with at
most 32 pending requests and a ten-second admission-to-completion deadline.
Git cancellation drains the process and its pipes. A source/Changes invalidation
aborts outstanding capture and changes the cache epoch; stale work cannot publish.
Shutdown stops admission, aborts outstanding work and drains it before releasing
the cache. Refresh regenerates the selected snapshot; it coalesces with an already
pending capture for the same accepted source snapshot.

Retain each generation for 60 seconds of inactivity so in-flight frames and
replaced snapshots stay coherent. Requests extend that retention. Bound retained
artifacts to 64 generations and 128 MiB, and each artifact to 64 MiB. Reject new
captures that exceed capacity rather than removing snapshots still within their
retention window. Expired entries are collected periodically and before new
capture. A failed refresh preserves previous snapshots and does not poison later
requests.

## Verification

Regressions must prove that selection avoids unrelated output reads and renderer
work, includes only the chosen variant, and keeps the existing before/after bytes.
Cover schema v2 and v3, removed and added sides, themes/viewports, asset isolation,
input mutation, malformed requests, coalescing, refresh, invalidation, cancellation,
shutdown and retry. Measure real browser comparison readiness on the large fixture
separately from startup and background Changes; a JSON response alone is not a
visible comparison.
