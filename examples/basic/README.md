# Basic Mokabook Consumer

This is a synthetic external-consumer fixture. It contains two distinct mobile
and desktop product-style screens built with `@firna/ui` controls, nested
collections, one use case, id-addressed links, a Firna renderer adapter, local
stylesheets, light and dark product fragments, and a safe Review-ignore region.
It contains no Accounting or Juno product screen.

The entry definitions use collection membership as their only navigation
hierarchy. The real `Example` collection owns `Screens` and the example tour;
the real `Design` collection owns the `Mokabook design` tree. Those parent
collections preserve the intended visible groups and automatically produce
the same breadcrumb ancestry. Consumer code does not provide `navPath`; when
migrating an older catalogue, keep a former synthetic group only by adding an
equivalent parent collection.

The Welcome screen uses
`<MockLink to="example-details" fragment="details">` to prove that generated
HTML keeps a portable relative artifact link while served and deployed Browse
navigate to the canonical Details page, retain its anchor through Light/Dark
swaps, and select the Details row in the catalogue tree. The reciprocal Details
link exercises the id-only form.

The prominent `View details` and `Return to welcome` Firna buttons use
`MockLink asChild`, alongside the three original text links. Both viewport
variants and both schemes retain native pointer and keyboard navigation; the
Details action includes its `details` anchor. The no-op handlers let Firna render
enabled controls; generated anchors handle the navigation without scripts.

The design screens use the same API for their brand, screen rows, miniature
content, flow references, inspector, and supported scheme, comparison, and tag
transitions. These links open canonical design states. Viewport, copy, refresh,
resize, collapse-all, and unsupported combinations remain visual depictions.
The actual outer shell provides its normal runtime controls. See the
[design mockup links contract](../../docs/protocol/mokabook-design-links.md)
and the [complete design inventory](../../docs/protocol/mokabook-shell-design.md#design-mockups).
Shared destinations live in [destinations.ts](./entries/design/parts/destinations.ts);
[navigation_states.ts](./entries/design/parts/navigation_states.ts) explicitly
selects which transitions each artboard supports. Add an owning screen and its
contract before enabling a new transition.

## Firna renderer adapter

`renderer.tsx` is the reference consumer adapter for react-native-web
component libraries: it wraps every screen in `SharedUiThemeProvider` (themed
by `theme.ts`), selects the light or dark theme from `input.colorScheme`,
renders one React tree with `react-dom/server`, collects react-native-web's
atomic styles through `AppRegistry`, and injects them into the document head.
The adapter also stamps the document's `data-color-scheme`/`color-scheme`
hooks and, for dark fragments, emits dark-safe body text and link colors for
plain HTML outside Firna components.
`mokabook.config.ts` enables both schemes and pairs the renderer with the
`moduleResolution` settings such a stack needs — the `react-native` →
`react-native-web` alias, `react-native`-first conditions and main fields,
`.web.*`-first resolve extensions, and the `.js` → `jsx` loader. Consumers that
render plain React DOM need none of this and can keep a plain
`renderToStaticMarkup` adapter.

The `Design` navigation group is the approved design catalogue for Mokabook's
own catalogue and Changes views. Its 24 screens cover Browse destinations,
inspector and navigation states, tag filters, color schemes, and comparison
outcomes; the canonical inventory above lists each route. Each has distinct
mobile and desktop variants. The design screens use `colorSchemes: ["light"]`
because they are light documents that draw the Mokabook shell, including the three that
depict the shell with dark selected; the two product screens inherit the
catalogue default and prove dark generation. All design headers use the approved
screen-stack logo: 17px overlapping mobile and desktop outlines in a 24px
sage square.
Desktop variants depict the
shared resize grip on the catalogue navigation in Current and comparison views; narrow variants
keep the drawer fixed. The recorded tokens and responsive rules live in
[`docs/protocol/mokabook-shell-design.md`](../../docs/protocol/mokabook-shell-design.md).

The shared-impact and ignored-only comparison examples open from All with zero
Changes. Dependency evidence remains available in comparison details, while
unchanged output and paired ignored-only edits do not fill the review list.

From the repository root:

```bash
npm run dev
```

This builds the local CLI, generates the catalogue, and watches entries, the
renderer, and configured stylesheets. Open the printed URL; the browser reloads
after watched edits. Forward Serve options with `npm run dev -- --port 0`.
Restart the command after changing Mokabook's `src/` files or unwatched inputs
such as this example's `theme.ts`.

For one-off generation, verification, or publishing an artifact:

```bash
npm run example:build
npm run example:check
npm run preview:build
```

Generated HTML and the schema-v3 manifest are committed under `generated/` so
the fixture also exercises stale and deterministic-output checks. The
hand-authored stylesheets (`styles.css`, `design.css`, `design-stage.css`,
`design-review.css`) also live under `generated/` because it doubles as the
public static root. `preview:build` snapshots this catalogue through the real
server into `.context/mokabook-preview` for Cloudflare Pages; it is the same
artifact used by the main and pull-request preview workflow. The snapshot
compares the catalogue with its branch point on `origin/main` and preserves
the catalogue's All/Changes filter, Light/Dark switch, client assets, and light/dark
fragment files, including when no routes changed. Public HTML copies pass
through the same ownership-aware link adapter as served Browse; direct preview
URLs apply one validated `fragment` query progressively in the parent shell.
Published and served screens offer the same comparison controls in the actual
Mokabook shell. Publishing prepares a validated Git comparison with isolated
before/after resources, including removed-screen pages; browsers request those
snapshots only after a comparison option is selected. Links inside the design frames navigate between authored artboards; their
pictured comparison controls do not request actual comparison snapshots. There is no separate Review
section or comparison CLI command.
