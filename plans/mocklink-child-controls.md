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

## Milestone 4: Commit, push, and review

Deliver the complete reviewed branch under the repository's required workflow.

- [ ] Inspect the diff and deletions against `origin/main`, then `git add -A`.
- [ ] Commit all completed work using Conventional Commits and push the branch.
- [ ] Run `cargo xtask review` after the push; do not automatically fix findings.
- [ ] Record review findings with severity, context, impact, lettered options,
      and recommendations; complete and re-index the plan.
- [ ] Validate and commit/push the final plan record if it changes after review.
