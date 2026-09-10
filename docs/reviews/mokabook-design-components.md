# Shared Design Component Adoption Review

The implementation at `7dc0d50` adds fifteen registered components and 56 saved
variants, and adopts them across all 56 existing design screens. The required
`cargo xtask review` ran after that commit was pushed, against `origin/main`
at `a0e349a`. The reviewer worked read-only; no review fixes were applied.

The local complete gate passed 744 Node tests, 193 browser tests and four Rust
tests. A subsequent CI run identified separate test setup, navigation timing
and mobile comparison-button sizing failures. Their verification follow-up is
tracked in [the adoption plan](../../plans/mokabook-design-components.md).
The complete gate passed again after those fixes: 744 Node tests, 194 browser
tests and four Rust tests, with all package, formatting, lint, type, generated
output and Rust checks passing. The direct-file audit covers all 224 design
fragments; 105 original views remain pixel-identical and seven mobile views now
share compact comparison sizing across native buttons and links.

## Findings From The Adoption Review

1. **Medium — served Review snapshots follow symbolic links.**
   [The response helper](../../src/server/review_responses.ts) checks lexical
   containment, then reads the requested path with an operation that follows
   symbolic links. A tampered artifact can therefore expose a file outside the
   retained generation through its snapshot URL. Doing nothing retains this
   gap at the HTTP boundary even if normal artifact generation is safe.

   Options: **A**, enforce confined regular-file reads when serving owned
   snapshots; **B**, harden artifact writing only; **C**, document artifact
   directories as trusted.

   **Recommended: A**, with regressions for both a linked leaf file and a linked
   ancestor directory returning 404. Checking only the leaf with `lstat` is not
   sufficient for ancestor links. A shared confined-read boundary protects all
   snapshot callers; writer-only checks do not protect files altered later.

2. **Medium — source validation accepts missing affected-consumer records.**
   [The validator](../../src/review/component_result_sources.ts) checks every
   supplied record against possible source usage, but does not reject an omitted
   record. A producer/export regression could under-report affected screens or
   components without being caught by this validation layer.

   Options: **A**, derive the complete expected set from the shared implementation
   impact policy and compare it with the supplied evidence; **B**, report omissions
   as warnings; **C**, document affected-consumer evidence as best-effort.

   **Recommended: A**, with omission tests and metadata-only regression coverage.
   The reviewer's direct set-equality suggestion needs refinement: the existing
   `possible` set includes every changed component, including variant/control
   metadata-only edits that intentionally have no affected consumers. Requiring
   equality with that superset would reject valid results. Share the actual
   implementation-impact rule before enforcing completeness; do not duplicate
   a looser classification in the validator.

3. **Low — inherited v4 entry fields merit contract clarification.**
   [Inherited entry validation](../../src/registry/manifest_validation.ts) accepts
   unknown fields for screens, collections and use cases, whereas component and
   usage structures use exact-key validation. The reviewer proposed extending
   exact-key checks to inherited entries, legacy pages and use-case steps.
   Retaining extra fields can carry non-contract metadata into Review comparison.

   This is a hardening suggestion, rather than a confirmed contract violation:
   [the manifest contract](../protocol/mokabook-component-manifest.md) requires
   strictness for new v4 structures and explicitly preserves inherited v3
   validation. Compatibility should not change accidentally while addressing it.

   Options: **A**, explicitly tighten the v4 contract and add version-scoped
   exact-key checks; **B**, discard unknown fields during parsing; **C**, clarify
   the existing inherited-entry compatibility policy.

   **Recommended: C** for the current contract. If strict inherited entries are
   desired, choose A as a deliberate contract change, using shared common/per-kind
   field definitions and tests for every entry kind plus v3 compatibility. B
   silently loses authored data and provides weaker diagnostics.

## Earlier Follow-ups Still Open

These were reported before adoption and remain separate from its implementation.

1. **Medium — component registry validation accepts malformed definitions.**
   [Registry preparation](../../src/registry/prepare.ts) and
   [entry validation](../../src/registry/entry_validation.ts) can accept a forged
   or mutated component whose missing variants later cause an unstructured
   error in [manifest generation](../../src/components/manifest_build.ts).
   Doing nothing leaves authors with internal errors instead of useful build
   diagnostics.

   Options: **A**, share component-definition validation between authoring and
   registry preparation; **B**, freeze definitions; **C**, guard only manifest
   generation. **Recommended: A**, with mutation/forgery tests. Shared validation
   prevents drift; freezing or a late guard alone leaves other entry paths weak.

2. **Medium — authored titles can inject Markdown into Review summaries.**
   [Summary generation](../../src/review/artifact.ts) inserts v3 change titles
   directly into Markdown. Newlines or Markdown syntax can make a generated
   summary misleading. Doing nothing retains that reporting ambiguity.

   Options: **A**, use a shared single-line Markdown-escaping helper; **B**, show
   only route/id; **C**, serialize raw titles as JSON. **Recommended: A**, with
   schema-v3 multiline/Markdown title tests, preserving useful names safely.

3. **Low — earlier component protocol delivery wording is stale.**
   Some component contracts describe implemented APIs as unavailable or planned.
   Doing nothing leaves conflicting author guidance. Options: **A**, align the
   current paragraphs; **B**, move historical wording to plans; **C**, add focused
   delivered-contract consistency checks. **Recommended: A + C**, reducing
   duplicated status text with B where useful. See the full
   [runtime review](./component-explorer-runtime.md).

4. **Medium — watched restarts can mix catalogue and controls generations.**
   The supervisor can apply a newly retained controls runtime to the old child
   before restarting its catalogue. Doing nothing leaves a window for inconsistent
   previews or stale-generation errors. Options: **A**, separate staging the next
   runtime from applying it live; **B**, use an atomic restart API; **C**, disable
   controls during restarts. **Recommended: A**, with supervisor ordering tests
   and a delayed-restart integration regression covering rebuild/reconfigure.
   See the full [runtime review](./component-explorer-runtime.md).
