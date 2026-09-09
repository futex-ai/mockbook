# MockLink Child Controls

Implement the approved [styled link controls contract](../docs/protocol/mokabook-link-controls.md)
so consumers can use their existing styled controls with Mokabook navigation.
Scope is the Mokabook package, documentation, and consumer/browser fixtures.
Accounting adoption and publishing a package release are subsequent work.

## Milestone 1: Define the contract — completed

Specify a complete opt-in API and its ownership, accessibility, and build rules.

- [x] Audit the Accounting failure and current Mokabook navigation boundary.
- [x] Fetch and preserve current main before integration. Source tip was
      `b5ed6dfa8d82ea8ef532f7873443ddaa9fca1440`; audit showed the navigation
      resize feature, which was retained by fast-forwarding to `b45327a`.
- [x] Write the protocol before implementation and index this plan immediately.

## Milestone 2: Implement static child controls — completed

Deliver a functioning, opt-in authoring API and shared build transformation.

- [x] Add failing regressions for conversion, default-byte compatibility,
      inactive states, invalid children, and ambiguous markup.
- [x] Add typed and runtime-validated `MockLink asChild` authoring.
- [x] Implement bounded marker parsing and source-offset control adaptation,
      preserving unaffected bytes and providing link/focus styling.
- [x] Preserve intrinsic button sizing and authored block width, protected by
      real Firna browser comparisons with the original button.
- [x] Integrate structured/legacy rendering before existing logical-link and
      compatibility validation; reject unconsumed markers afterwards.
- [x] Cover destinations, fragments, viewports/schemes, custom renderers,
      disabled ancestors, conflicting attributes, and malformed markers.
- [x] Reject scripted descendants and keep injected control styles in the
      owning document head, including documents containing SVG elements.
- [x] Run the focused unit/integration suite and package build successfully.

## Milestone 3: Verify consumers and document adoption — completed

Prove the API works with custom renderers and real consumer UI controls.

- [x] Add typed NodeNext and clean packed-consumer coverage.
- [x] Exercise a real Firna button in both viewports with pointer/keyboard
      Browse and use-case navigation, focus, disabled/busy behavior, standalone
      files, and Review snapshots.
- [x] Update the README and package/rendering documentation with usage,
      limitations, and Accounting migration guidance; mark the contract delivered.
- [x] Complete relevant tests and `cargo xtask check` (including clippy).

Validation: 78 focused tests, six real-Firna browser smoke tests, and the full
`cargo xtask check` passed. The gate includes 364 unit/integration tests, packed
consumers, browser coverage, formatting, lint, typechecking, clippy, and Rust
tests. An initial port-allocation test race passed in isolation and on the full
rerun. Mobile/desktop screenshots were inspected.

## Milestone 4: Commit, push, and review — completed

Deliver the complete reviewed branch under the repository's required workflow.

- [x] Inspect the diff and deletions against `origin/main`, then `git add -A`.
- [x] Commit all completed work using Conventional Commits and push the branch.
- [x] Run `cargo xtask review` after the push; do not automatically fix findings.
- [x] Record review findings with severity, context, impact, lettered options,
      and recommendations; complete and re-index the plan.
- [x] Validate and commit/push the final plan record if it changes after review.

The implementation was committed as `09e9ec1` and pushed to
`calummoore/feat-mocklink-for-buttons` before `cargo xtask review` completed
successfully. The full gate passed 364 unit/integration tests, 70 Chromium
tests, and three Rust tests. The working diff contained no mainline deletions.

## Review outcome

Items 1–4 below are recorded for the user to decide; the implementation and
README were not changed in response to review. Item 5 described the expected
pre-review delivery state: this final record and index update complete the
already-planned post-review bookkeeping.

1. **Severity: Medium — child markers can bypass safety checks by changing attribute case.**

   Context: [src/build/link_controls.ts](../src/build/link_controls.ts#L30) only enters the adapter when `html.includes(CHILD_MARKER)`, and [src/build/link_controls.ts](../src/build/link_controls.ts#L166) uses the same case-sensitive check after compatibility output. HTML attribute names are case-insensitive, so `DATA-MOKABOOK-LINK-CHILD-START` can ship unconsumed if emitted by a renderer or compatibility transformer.

   Impact of doing nothing: internal reserved markers can leak into generated output, and the documented “unconsumed markers fail the build” contract is not actually enforced.

   Options: A. Use a case-insensitive marker scanner/regex for the precheck and post-transform assertion, with tests for uppercase renderer output and uppercase compatibility-transform output. B. Document lowercase-only reserved markers, but that conflicts with HTML parsing semantics.

   Recommended: A.

2. **Severity: Medium — `data-mokabook-link-control` is only reserved on the adapted root.**

   Context: the injected stylesheet targets every `a[data-mokabook-link-control]` in the document at [src/build/link_control_patches.ts](../src/build/link_control_patches.ts#L15), but the reserved-metadata check only rejects the attribute on the root being adapted at [src/build/link_control_patches.ts](../src/build/link_control_patches.ts#L88).

   Impact of doing nothing: an unrelated consumer-authored anchor with that attribute can be restyled whenever any active child control causes the stylesheet to be injected, violating the “patch only marked controls” safety boundary.

   Options: A. Globally reject package-owned link-control metadata before injecting styles and after compatibility transforms, case-insensitively. B. Rename to a less likely internal attribute but still enforce it. C. Only document the reservation.

   Recommended: A.

3. **Severity: Low — focusable ancestors are allowed despite the multiple-keyboard-target contract.**

   Context: [src/build/link_controls.ts](../src/build/link_controls.ts#L127) checks ancestors with `isInteractive(ancestor, false)`, which excludes `tabindex`; [src/build/link_control_nodes.ts](../src/build/link_control_nodes.ts#L71) otherwise treats focus targets as interactive. The protocol says interactive ancestors are invalid to prevent multiple keyboard targets.

   Impact of doing nothing: `<div tabIndex={0}><MockLink asChild ... /></div>` can produce redundant nested focus targets and drift from the documented accessibility rule.

   Options: A. Treat focusable ancestors as interactive and add a regression test. B. Intentionally allow focus wrappers and update the protocol/tests to say so.

   Recommended: A.

4. **Severity: Low — public README includes downstream Accounting/Firna migration guidance.**

   Context: [README.md](../README.md#L118) puts Accounting-specific Firna `Button` instructions in the package README.

   Impact of doing nothing: app-independent Mokabook docs remain coupled to one consumer app/framework, which can confuse package users and make future README maintenance noisier.

   Options: A. Move that migration guidance to `docs/migration` or the plan, and keep the README generic. B. Reword it as a generic custom-component note.

   Recommended: A.

5. **Severity: Low — delivery plan status is stale for a committed/pushed review diff.**

   Context: [plans/mocklink-child-controls.md](../plans/mocklink-child-controls.md#L49) says full validation passed, but [plans/mocklink-child-controls.md](../plans/mocklink-child-controls.md#L55) leaves commit, push, review, and final plan recording unchecked; [plans/README.md](../plans/README.md#L5) still lists the plan as active.

   Impact of doing nothing: reviewers cannot tell whether post-push review happened or whether the feature is complete.

   Options: A. After review disposition, update Milestone 4 and move the plan to Completed when appropriate. B. Keep it active but record these findings explicitly.

   Recommended: A.

Reviewer scope: committed `HEAD` `09e9ec1` against local `origin/main` `b45327a`. No deletions were present, and `git diff --check origin/main..HEAD` was clean. The reviewer ran read-only and did not repeat the build/tests; the full implementation gate had already passed before the commit and push.

### Scope recommendations

For items 1 and 2, prefer one parsed-attribute reservation policy shared by
authoring adaptation and compatibility validation, with mixed-case and
unrelated-anchor regressions. Reject consumer-authored reserved attributes and
verify ownership after compatibility transforms while retaining metadata
generated by the adapter. This takes more work than two string checks but
protects future reserved attributes and avoids treating ordinary text as HTML
metadata. For item 3, decide the ancestor-focus contract explicitly and test
both positive tab order and programmatic-focus containers before broadening
rejection. For item 4, retain the migration content in a linked consumer guide
and keep the public README example generic. No new implementation milestones
are opened until the user chooses which review recommendations to address.
