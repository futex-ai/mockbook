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

The `Design` navigation group is the owning design catalogue for Mokabook's
Browse and Changes views. Its nineteen existing screens cover navigation,
Details, tags, color schemes, and comparison outcomes. Eighteen component
explorer screens add component pages, saved variants, affected screens,
repeated/nested inspection, highlighting, and empty or removed states. Every
screen has distinct mobile and desktop components. The component designs are
static mockups; the component runtime and editable controls are later milestones.

Open `design/components/overview.html` in Browse, or open
[`generated/design/components/overview.desktop.html`](./generated/design/components/overview.desktop.html)
and [`overview.mobile.html`](./generated/design/components/overview.mobile.html)
directly from disk. Links beneath each artboard connect the owning design pages;
links inside the designs connect component pages, variants, and consuming screens.
Each child gallery lists at most five owning screens; inspection also links
two selected-instance screens in a nested gallery.

All thirty-seven design screens use `colorSchemes: ["light"]`: they draw the
Mokabook shell, including the existing dark-selection examples. The two product
screens inherit the catalogue's light/dark settings and prove dark generation.
Design headers retain the approved screen-stack logo and desktop navigation
resize grip. The component designs reuse the existing shell, frames, controls,
and Details panel, with synthetic usage fixtures under
`entries/design/components/parts`. No component feature is added to the public API.

The recorded tokens and responsive rules live in the
[shell design contract](../../docs/protocol/mokabook-shell-design.md); component
routes, fixture relationships, mask geometry, and delivery status live in the
[component design contract](../../docs/protocol/mokabook-component-design.md).

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
`design-review.css`, and the component design stylesheets) also live under `generated/` because it doubles as the
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
snapshots only after a comparison option is selected. The design screens inside
the frames remain static pictures of that shell. There is no separate Review
section or comparison CLI command.
