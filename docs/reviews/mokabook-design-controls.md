# Shared Design Controls Delivery Review

The footer and view-control normalization is committed and pushed as `4e81ca0`.
After the push, `cargo xtask review` inspected the complete committed branch
against `origin/main` at `a0e349a`, read-only. It reported four Medium and two
Low findings, all in the wider component-explorer/runtime work; none concerned
the footer cleanup itself. The recommendations below were checked against the
implementation. No review findings were automatically fixed.

## Findings

1. **Medium — served Review snapshots follow symbolic links.**
   [The response helper](../../src/server/review_responses.ts) confines paths
   lexically, then reads them with `fs.readFileSync`, which follows links. A
   tampered retained generation could expose files outside its artifact root
   through snapshot URLs. Doing nothing retains that request-time read gap.

   Options: **A**, use a shared confined regular-file reader at the serving
   boundary; **B**, harden artifact writing only; **C**, document artifact
   directories as trusted local state. **Recommended: A**, with linked leaf
   and linked ancestor-directory tests returning 404. Writer-only protection
   does not cover artifacts altered later; leaf-only checks miss ancestor links.

2. **Medium — affected-consumer validation accepts omitted records.**
   [Source validation](../../src/review/component_result_sources.ts) validates
   supplied consumers against possible usage but does not require the complete
   expected set. A producer/export regression can therefore hide affected screens
   or components while still passing validation.

   Options: **A**, derive and compare the complete implementation-impact set;
   **B**, use weaker length/subset checks; **C**, warn about omissions.
   **Recommended: A**, sharing the classification policy with
   [generation](../../src/review/component_classification.ts) and adding both a
   missing-consumer test and a metadata-only edit regression. Comparing against
   the current `possible` superset would be wrong: variant/control metadata
   changes intentionally do not make consumers affected. A shared policy avoids
   divergent definitions of impact.

3. **Medium — watched restarts can mix runtime and catalogue generations.**
   [Watched rebuild/reconfiguration](../../src/server/serve_watched.ts) replaces
   the component runtime before restarting the child. The
   [supervisor](../../src/server/supervisor.ts) immediately sends it to the
   current child, which still has its startup catalogue. Doing nothing leaves a
   window for old control/variant metadata to use a new rendering generation,
   causing inconsistent previews or stale-generation failures.

   Options: **A**, distinguish staging the next runtime from applying a live
   update; **B**, introduce an atomic restart-with-runtime API; **C**, disable
   controls while restarting. **Recommended: A**, retaining live updates when
   the manifest is unchanged. Add supervisor ordering tests and delayed-restart
   integration coverage for rebuild and reconfiguration; a UI-only workaround
   leaves the lifecycle contract ambiguous.

4. **Medium — malformed component definitions bypass registry validation.**
   [Registry preparation](../../src/registry/prepare.ts) accepts forged or
   mutated component definitions, while full validation happens only inside
   [the authoring helper](../../src/components/definition.ts).
   [Manifest generation](../../src/components/manifest_build.ts) subsequently
   assumes `variants.map` exists. Doing nothing leaves malformed exports with
   internal TypeErrors instead of useful build diagnostics.

   Options: **A**, share definition validation at authoring and registry
   boundaries; **B**, freeze definitions; **C**, guard manifest generation only.
   **Recommended: A**, with mutation/forgery tests. A shared validator covers
   every entry path and avoids drift; freezing and late guards alone do not.

5. **Low — Review summaries insert authored titles as raw Markdown.**
   [Schema-v3 summary generation](../../src/review/artifact.ts) interpolates
   change titles directly into Markdown. Newlines and Markdown syntax can make
   generated change summaries misleading. Doing nothing retains that ambiguity.

   Options: **A**, escape Markdown and display each title on one line; **B**, show
   only route/id; **C**, serialize rows as JSON. **Recommended: A**, using a
   shared presentation helper with multiline and Markdown-title regressions.
   This keeps useful titles while consistently protecting generated summaries.

6. **Low — current protocol wording conflicts on supported versions.**
   [The export contract](../protocol/mokabook-export.md) still unconditionally
   says to retain Review schema v2, while its component section specifies v3.
   [The root README](../../README.md) describes the v2 compatibility fallback as
   applying only when v3 is absent, without mentioning the new v4 format.
   Doing nothing leaves contradictory guidance for consumers and maintainers.

   Options: **A**, align current version/status wording; **B**, move historical
   migration details into dedicated guidance; **C**, add focused contract
   consistency checks. **Recommended: A + C**, explicitly distinguishing legacy
   and component formats; use B where it reduces repeated historical text.
   The review also noted Accounting-specific compatibility wording. That label
   alone is not a runtime independence defect: retain any intentionally supported
   compatibility behavior, and clarify its scope instead of deleting it.

## Verification And Earlier Follow-ups

- `cargo xtask check` passed: **747 Node tests, 200 browser tests and four Rust
  tests**, including dependency audit, formatting, lint, types, generated output,
  packed consumers, Rust formatting/clippy and the Rust file-length audit.
- Every one of the **222 design fragments** was checked directly from disk in
  its mobile/desktop context with scripts disabled, resource/overflow assertions
  and visual capture. All 56 original screen ids/routes remain. The removed
  legacy variant leaves fifteen shared components and 55 saved variants.
- The [deployed preview](https://pr-48.mokabook.pages.dev) passed desktop/mobile
  smoke checks for current footer variants, native Details opening/closing,
  actual viewport selection, read-only exported props and nested usage. It made
  no local rendering/watch requests. Deployment:
  [34522747292](https://github.com/futex-ai/mokabook/actions/runs/34522747292).
- Local evidence is retained under `.context/design-modern-controls-*`, including
  the final check, direct-file audit, published smoke and complete review logs.
- [Earlier adoption reviews](./mokabook-design-components.md) remain recorded.
  The inherited-v4 unknown-field suggestion was not repeated in this review;
  it still calls for contract clarification before changing compatibility.
  The earlier runtime review's broader delivery-wording follow-up remains open.

Node 24, macOS and Windows passed CI for `4e81ca0`; Node 22.14 passed all 747
Node tests and 199 of 200 browser tests, but exposed a skip-link history race.
The follow-up is tracked in milestones 11–12 of
[the shared-component adoption plan](../../plans/mokabook-design-components.md).
It is separate from the six review findings, which remain for the user's decision.

## Keyboard History Correction

Native skip-link activation and fragment Back/Forward previously fetched and
replaced the same catalogue view. The first regression reproduced three unwanted
requests; a second reproduced the extra requests around saved-variant history.
The correction retains same-document views and native focus, invalidates pending
route work, and tracks local variant changes so route/query history still restores
the matching screen. It does not increase interaction timeouts or change layouts.

The corrected implementation passed `cargo xtask check`: **749 Node tests, 203
browser tests and four Rust tests**, with all other gates passing. Focused tests
also cover cancellation during native Back, route scroll restoration and the
original keyboard test. Logs: `.context/design-keyboard-history-red-complete.log`,
`.context/design-keyboard-history-browser-final.log` and
`.context/design-keyboard-history-full-check.log`. The post-push CI, published
smoke and repeated review are the remaining delivery checks.
