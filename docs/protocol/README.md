# Protocol

These documents define Mokabook's implementation contract. They describe
implemented pre-release behavior unless a document's Delivery Status explicitly
labels an approved target that is still tracked by an active plan. Package,
authoring, static build/check, responsive Browse, watched development, on-demand comparisons,
packed consumer verification, CI, and npm release automation are implemented.
The first public release and downstream Accounting cutover remain external
delivery steps.

## Supported Formats

| Catalogue                     | Generated manifest | Comparison result |
| ----------------------------- | ------------------ | ----------------- |
| Without registered components | 3                  | 2                 |
| With registered components    | 4                  | 3                 |

The current generated manifest is v4 only when it contains registered
components; comparisons use v3 whenever either side is v4. Removing all
components therefore restores a v3 current manifest while retaining a v3
comparison against the earlier v4 baseline. The primary
`mokabook-manifest.json` reader accepts manifest v3 and v4. Explicit
`compatibility.readManifestV2` permits the legacy Accounting-format fallback
only when the primary file is absent, never when it is invalid.

## Contracts

- [Package and authoring contract](./mokabook-package.md)
- [Build and Browse runtime](./mokabook-runtime.md)
- [Changes and screen comparisons](./mokabook-changes.md)
- [Registered components](./mokabook-components.md)
- [Component runtime prop schema](./mokabook-component-props.md)
- [Component manifest v4 schema](./mokabook-component-manifest.md)
- [Component comparison v3 schema](./mokabook-component-review.md)
- [Component change attribution](./mokabook-component-changes.md)
- [Component pages and screen inspection](./mokabook-component-explorer.md)
- [Component explorer design catalogue](./mokabook-component-design.md)
- [Component icon inspector design](./mokabook-component-inspector-design.md)
- [Component controls design catalogue](./mokabook-component-controls-design.md)
- [Component workspace design](./mokabook-component-workspace-design.md) (view controls, resizing, and comparison eligibility)
- [Component controls](./mokabook-component-controls.md)
- [Consumer static export](./mokabook-export.md) — consumer CLI and
  transactional artifact-generation contract.
- [Static export delivery](./mokabook-export-delivery.md) — portable
  hosting, navigation, and comparison behavior.
- [Export recovery](./mokabook-export-recovery.md) — backup ownership,
  concurrent destination changes, bounded cleanup, and failure reporting.
- [Watched development](./mokabook-watch.md)
- [Catalogue navigation contract](./mokabook-navigation.md)
- [Styled catalogue link controls](./mokabook-link-controls.md)
- [Shell design contract](./mokabook-shell-design.md)
- [Design mockup links](./mokabook-design-links.md)
- [Registered components in Mokabook's design catalogue](./mokabook-design-components.md)
  — implemented shared design components and ownership rules, with the
  [component library inventory](./mokabook-design-component-library.md).
- [CI and npm release contract](./npm-release.md)
- [Dependency security](./dependency-security.md) — advisory gates, targeted
  updates, temporary overrides, and packed-consumer audit coverage.
