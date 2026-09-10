# Protocol

These documents define Mokabook's implementation contract. They describe
implemented pre-release behavior unless a document's Delivery Status explicitly
labels an approved target that is still tracked by an active plan. Package,
authoring, static build/check, responsive Browse, watched development, on-demand comparisons,
packed consumer verification, CI, and npm release automation are implemented.
The first public release and downstream Accounting cutover remain external
delivery steps.

- [Package and authoring contract](./mokabook-package.md)
- [Build and Browse runtime](./mokabook-runtime.md)
- [Pages in the catalogue](./mokabook-pages.md)
- [Source protection](./mokabook-source-protection.md)
- [Catalogue change metadata](./mokabook-catalogue-changes.md)
- [Breaking page migration](./mokabook-page-migration.md)
- [Optional changes in publication](./mokabook-publication.md)
- [Changes and screen comparisons](./mokabook-changes.md)
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
- [CI and npm release contract](./npm-release.md)
- [Dependency security](./dependency-security.md) — advisory gates, targeted
  updates, temporary overrides, and packed-consumer audit coverage.
