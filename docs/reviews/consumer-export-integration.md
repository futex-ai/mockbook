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

Main was fetched again after these changes and remains `a5ecbc0`. The merged
implementation was committed and pushed as `43b6de0`. Seven post-commit
static-example/Cloudflare browser smoke tests passed against that merged
baseline; mobile and desktop screenshots were inspected. The required
post-push `cargo xtask review` completed successfully on 2026-09-09 against
`origin/main` (`a5ecbc0`), with the three observations below. Its read-only audit
confirmed 99 changed files and no committed deletions.

[PR #49](https://github.com/futex-ai/mokabook/pull/49) targets `main` and is open,
not merged. No npm release was performed. PR preview deployment and Node 24 CI
passed. The first Node 22.14 CI attempt passed 552/553 unit/integration tests,
failing the existing symlink-recovery Changes-count assertion in
`tests/watch_resource_boundaries.test.ts:84`. That file and its resource-watcher
implementation are unchanged from main. Both tests in the file passed on a
focused local rerun. The
[Node 22 retry](https://github.com/futex-ai/mokabook/actions/runs/34387519308/job/102590264620)
failed at the same assertion, again with 552/553 tests passing. This is not
established as a flake, and its cause has not been isolated. The requested PR
delivery is complete, but the PR is not merge-ready: this CI failure remains
unresolved, and the two code recommendations below need a user decision.

## Post-Push Review

### 1. Medium — Deployment identity covers only comparison output

The exporter hashes `comparisonFiles` in [site.ts](../../src/export/site.ts),
then adds shell HTML, navigation, public files, CSS, modules, fonts, and adapter
output. [adoptStaticDelivery](../../src/client/static_delivery.ts) uses only
`comparisonUrl` to decide whether a page belongs to the current deployment.
An independent in-memory check confirmed that changed route metadata with the
same comparison URL is adopted without a full reload.

Impact: a new export can replace shell/navigation/assets without changing the
comparison inventory. An already-open tab can then combine its old shell or
client code with a new page instead of loading the complete deployment.

Options: A) compare descriptor metadata too, which catches route-map changes but
not every asset/client change; B) add a separate deterministic deployment ID
covering the final artifact and aliases; C) always use full-page navigation.
Recommended: B, with a documented hashing/finalization contract and regressions
where comparison bytes are unchanged but shell, client, assets, or adapter
output changes. This is broader than a descriptor-only patch but protects the
whole deployment boundary while retaining progressive navigation. Not fixed;
requires user approval.

### 2. Low — Preview confinement checks lexical paths only

The repository adapter in [catalogue.mjs](../../scripts/preview/catalogue.mjs)
requires the output string to sit below `.context`. The shared export path
validator enforces real repository/protected-root boundaries, but not the
adapter's narrower `.context` boundary. A symlink ancestor can therefore point
a lexically valid preview output at another allowed directory inside the repo.

Impact: preview files can be installed outside their documented scratch area.
Shared export ownership and source/root protections still apply; this finding
does not establish arbitrary external writes or unowned-directory deletion.

Options: A) enforce projected-realpath containment beneath the preview scratch
root; B) reject every symlink ancestor; C) document lexical-only confinement.
Recommended: A, reusing shared path-resolution helpers and testing ancestor
symlinks, a symlinked `.context`, and retargeting before installation. Define the
adapter boundary once so lexical and physical checks cannot drift. This retains
safe symlinks more selectively than B. Not fixed; requires user approval.

### 3. Low — Delivery bookkeeping was pending at the review snapshot

The reviewer observed unchecked review/PR closeout tasks and an active plan.
At `43b6de0`, review had not yet finished, so those pending states were accurate.
The already-planned post-review bookkeeping now records the results, closes
the requested delivery milestone, and lists the unapproved findings separately.

Impact if left pending: readers could mistake delivered work for unfinished
implementation, or assume that new recommendations had already been accepted.
Options: A) leave the original delivery active; B) complete its existing
closeout and preserve follow-up decisions in this report; C) add implementation
TODOs for the new findings immediately. Recommended: B. C would conflate
reviewer recommendations with user-approved scope. This is the previously
authorized delivery step, not an automatic implementation of new findings.

The two code follow-ups remain open for the user's decision. Their existence
does not reopen completed milestones or authorize another implementation cycle.

## CI Follow-Up — Not An AI Review Finding

The repeated Node 22 failure occurs after replacing an escaping symlink with a
regular file. The test waits for the first newer catalogue version and then
expects the Changes count to return to zero. The failing log does not establish
whether it observed an intermediate publication or a persistent recovery bug.

Impact: required CI remains red, so local and Node 24 success are insufficient
to treat the PR as merge-ready. Options: A) reproduce on Node 22/Linux with
version/content diagnostics, then fix the proven lifecycle or test-observation
boundary and add deterministic coverage; B) skip/relax the test; C) keep retrying
without identifying the cause. Recommended: A. If multiple valid publications
are the cause, use a shared semantic-state waiter with regression tests rather
than adding sleeps; if recovery is broken, fix the watcher itself. No test was
skipped or weakened, and no watcher change was made for this new CI issue.
