# Consumer Export: Alias Fix And Main Integration

## Approved Fix

The user approved the Medium adapter-alias finding in the
[preceding review](./consumer-static-export.md), followed by merging latest main
and creating a PR. File assembly and alias validation now share
`src/export/path_index.ts`: the same case-folded equality and directory-prefix
rules cover both kinds of route. The final ownership marker participates too.
Exact byte-identical file deduplication and distinct aliases sharing a target
remain supported. Alias collisions fail before replacing the previous site.

Thirteen regression/compatibility tests cover file/alias and alias/alias
collisions, both alias insertion orders, case folding, valid siblings, the
ownership marker, and real preview-adapter builds for routed and public pages.
Ten failed before the fix; all 28 focused alias/export/preview tests then passed.

## Mainline Preservation

Fetched main from source tip `5b143d1091c91a9deeadb43ca72034d7926d5b47`.
Its merge base was `93ac77848993bf1757eceac9387aef485823acf2`; incoming main was
`a5ecbc06d6169ec4af5329d52b6f13b2cd2f0276`. The audit covered all 50 changed or
added paths: material-output Changes filtering, resource validation/watching,
comparison diagnostics, protocols, design examples, and tests.

Two conflicts were resolved path-by-path in `src/server/watch_events.ts` and
`docs/protocol/mokabook-watch.md`. Both retain main's referenced-resource reloads
and readiness lifecycle alongside inventory-aware export ignores. No mainline
files were deleted. Main's design sources/generated files, comparison changes,
resource watchers, and existing test changes are retained.

The exporter now also calls main's material-output/resource Changes calculation.
An optional reader lets that shared calculation consume the same captured public
bytes as comparisons; Serve retains its live filesystem reader. This preserves
main's ignored-only and impact-evidence exclusions while keeping linked-resource
edits visible. Three new integration tests and the updated ignored-only export
test reproduced four failures before this compatibility adjustment.

## Validation And Delivery

All 155 focused export, preview, Changes, and watch tests passed on the merged
tree, including the 16 new tests. Three full-gate attempts on this shared Mac
encountered watcher startup/update deadlines under default test-file parallelism,
on both Node 25 and the CI-aligned Node 24 runtime. Individual and sequential
watcher checks passed; a four-worker run then passed all 10 affected watch tests.
The npm test entrypoint now bounds file parallelism at four without changing
coverage, individual concurrency cases, or any timeout.

With Node 24.2.0 selected, `MOKABOOK_PLAYWRIGHT_PORT=60219 cargo xtask check`
passed all 553 unit/integration tests, 104 browser tests, packed consumers,
package/license checks, current generated-example verification, formatting,
lint, typechecking, Rust formatting/Clippy, three Rust tests, and the file-length
audit. No test failed, was cancelled, or was skipped in that complete run.

Main was fetched again after these changes and remains `a5ecbc0`. The required
post-push review is pending. New findings will be reported with severity, impact,
options, and a recommendation, not automatically fixed. PR delivery is tracked
in [Milestone 9](../../plans/consumer-static-export.md).
