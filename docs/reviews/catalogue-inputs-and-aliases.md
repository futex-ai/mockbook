# Catalogue Input And Alias Review

These findings came from review invocation 4 after `3eae8be` was pushed. The
user authorized all four fixes. Earlier findings and verification remain in
[the catalogue review record](./catalogue-pages-and-publication.md).

1. **Medium — imported asset bytes escape authoring-input tracking. Resolved.**
   [Graph classification](../../src/build/source_inventory.ts) excluded loaders
   such as `dataurl` before forming the source inventory. A probe imported an SVG
   into a screen title: changing it changed the title from `25` to `72` after a
   manual build, but the asset had no source/resource watch, classified as
   `ignore`, and remained public. This violated the mixed-role source rule and
   left authored output stale during development. Inventory freshness checks
   compare path membership, not file contents; they do not promise to detect
   ordinary edits to an already listed source either.
   Options: **A.** Track imported bytes that affect authoring as protected source
   inputs regardless of asset extension/loader, retaining ordinary URL-referenced
   public resources. **B.** Add a separate inventory for public assets that require
   rebuilding authored output. **Recommended and applied: A**, using the shared graph boundary
   and regressions across loaders/config/consumer graphs. B preserves a broader
   public-asset API but adds a second inventory and conflicts with the current
   mixed-role protection contract unless that contract changes.

2. **Medium — Changes misses edits behind a stable public alias. Resolved.**
   [Resource matching](../../src/server/changed_resources.ts) compared only logical
   reference routes to Git paths, while the watcher already recorded physical paths.
   Screen and page probes kept `image.svg -> assets/logo.svg` unchanged and
   edited only the target. Both physical/logical paths remained watched and the
   action was `reload`, but `changedRoutes` was empty. Users could miss a real
   visual change in the catalogue filter. Historical comparison readers still
   reject Git symlinks; this finding does not propose weakening that safeguard
   or claim that every such screen can publish a baseline comparison.
   Options: **A.** Match both logical routes and validated physical identities
   from the shared resource reader. **B.** Reject public aliases across build,
   serve, watch, and publication. **Recommended and applied: A**, with target-only edit tests
   for pages/screens and flow propagation. Reuse the reader's confined locations;
   duplicating realpath handling risks inconsistent source and escape checks.

3. **Medium — publication follows unconfined links and drops valid public aliases. Resolved.**
   [Fingerprint enumeration](../../scripts/preview/inputs.mjs) followed unrelated
   symlinks when hashing, while [public copying](../../src/publication/resources.ts)
   skipped them before applying its public-file guard. Probes confirmed a read of
   a harmless file outside the configured consumer root, failure on an unrelated
   dangling link, and successful publication in both modes with an omitted image
   alias still referenced by the published HTML. The outside bytes entered the
   digest; the probe did not expose them in the artifact.
   Options: **A.** Share confined enumeration with logical/physical identities,
   hash link text, and validate source/public eligibility before reading or
   materializing targets. **B.** Reject symlinks during publication.
   **Recommended and applied: A**, plus exported-reference checks in both modes and coverage
   for source/metadata aliases, escapes, and dangling targets. Fixing copying
   alone leaves the fingerprint boundary inconsistent. The omitted-alias behavior
   also exists on the audited main revision.

4. **Low — CLI and nested-entry documentation remains contradictory. Resolved.**
   The [package contract](../protocol/mokabook-package.md) rejected `review` and
   `--out` but still described a Review CLI output override. Parser probes reject
   both `review` and `serve --out`, as the existing CLI tests require. The
   [NestedChild comment](../../src/authoring/types.ts) also named only screens and
   collections although its union includes pages. Leaving these statements
   misdirects consumers and omits pages from generated API guidance.
   Options: **A.** Correct both statements and link CLI guidance to its canonical
   section, distinguishing the repository preview script's valid `--out` option.
   **B.** Consolidate the duplicated API/CLI summaries into owning references.
   **Recommended and applied: A.** Existing parser tests cover runtime; a blanket flag-string
   lint would confuse the two interfaces. The CLI wording predates this branch;
   the nested-page comment needs updating with the expanded type.

The reviewer inspected the committed diff read-only and passed its whitespace
check; it did not rerun write-producing test suites. The prior review record
supplies its runtime verification. Independent probe scripts/results are
retained under `.context/review-followup-2-{public-alias-probe,input-probes,cli-probe}`;
all disposable consumers were removed and no original consumer files changed.
Items 1–3 share input classification and file-identity concerns. A shared policy
with boundary regressions was implemented after the user authorized all four
items. No new plan was created; completed feature milestones remain complete.

## Resolution And Verification

Imported bundler inputs now reach the same strict inventory boundary regardless
of loader. A shared confined location records both logical and physical paths
for source checks, public HTTP, Review, Changes, watches, and publication.
Changes compares both resource identities without weakening Git snapshot rules.

Publication shares typed enumeration and validated reads for its fingerprints
and static tree. Link metadata is hashed without reading outside/unresolved
targets. Safe public file and directory aliases become regular exported files;
HTML/CSS resource references are checked against the completed staged tree.
The package CLI and nested-child documentation now match their implemented APIs.

The new regression run reproduced 17 failures with two passing controls before
production edits. After the fixes, all 22 focused tests and all 74 existing/new
boundary tests passed, including a live watched-server asset-import smoke test.
Final `cargo xtask check` passed: 564 Node tests, 104 Chromium tests, 3 Rust
tests, formatting, lint, typechecking, example freshness (70 files), package
checks and packed consumers, clippy, and the Rust file-length audit (10 files).
The real example also published successfully. All 184 local Markdown targets
across 25 changed documents validated.

A stricter confinement regression caught artifact-marker probes through outside
directory links; marker checks now run only after physical confinement. The
final gate also exposed an existing browser-test race between two frame-link
clicks. Adding the missing intermediate URL assertion fixed the scenario; it
passed five repetitions per viewport and the complete browser suite. Runtime
timeouts, retries, and navigation behavior remain unchanged.

The implementation and checks are complete. The required review follows the
commit and push; its result will be recorded here.
