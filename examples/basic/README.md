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
transitions. These links open canonical design states. Component designs also
support native viewport/theme/highlight controls and inspector resizing. Other
viewport/resize controls, copy, refresh, collapse-all, and unsupported combinations
remain visual depictions.
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

The `Design` navigation group is the owning design catalogue for Mokabook's
Browse and Changes views. Its twenty-four Browse and Changes screens cover navigation,
Details, tags, color schemes, and comparison outcomes. Thirty-two component
explorer screens add component pages, saved variants, affected screens,
repeated/nested inspection, highlighting, and empty or removed states. The shared icon inspector and complete controls
mockups include edited/reset, optional, loading, validation, retry, comparison,
and published saved-variant states. Every
screen has distinct mobile and desktop components. The component designs are
static mockups; the component runtime and live preview rendering are later milestones. Native
fields can be edited, and authored state links show the planned outcomes.

A grouped icon toolbar switches Mobile/Desktop/Both previews, light/dark, and
screen highlighting without navigation. Leaf components omit Nested components;
Toolbar demonstrates composition. Unchanged fixtures show Unmodified and omit
comparison modes. The fixed desktop shell contains separate preview and inspector
panes; drag the centered divider grip to resize the inspector. Mobile uses a
rounded bottom sheet over the preview, with an iOS-style grabber that toggles
compact/expanded heights by touch, click, or Space. Pan gestures belong to the
later runtime milestone. In both layouts, the icon strip stays visible while the
active content scrolls; closing and reopening retains edits. Viewport carets,
the mobile menu, and the Usage icon use centered SVGs. Known entries show
Added, Changed, Removed, or Unmodified; removing a variant marks its surviving
component Changed. The States → Additions gallery demonstrates a newly added Badge.
Comparison facts live in Details, using shared fixture values for prop differences
and linked component changes. These rows do not generate descriptions of visual
changes. Disabled highlighting explains its specific reason, and outline labels
use separate rounded chips with a gap above the highlighted region.

Open `design/components/overview.html` in Browse, or open
[`generated/design/components/overview.desktop.html`](./generated/design/components/overview.desktop.html)
and [`overview.mobile.html`](./generated/design/components/overview.mobile.html)
directly from disk. The catalogue hierarchy links all owning design pages;
there is no navigation footer inside an artboard. Product links connect
component pages, variants, and consuming screens. The `controls` collection
provides the canonical controls example plus Editing, States, and Published
galleries; `inspector` shows both closed-panel layouts.
Each child gallery lists at most five owning screens; inspection also links
two selected-instance screens in a nested gallery.

All fifty-six design screens use `colorSchemes: ["light"]`: they draw the
Mokabook shell, including the existing dark-selection examples. The two product
screens inherit the catalogue's light/dark settings and prove dark generation.
Design headers retain the approved screen-stack logo: 17px overlapping mobile
and desktop outlines in a 24px sage square. Desktop keeps the navigation resize
grip; mobile keeps its fixed drawer. The component designs reuse the existing shell, frames, controls,
and a shared icon inspector, with synthetic usage fixtures under
`entries/design/components/parts`. No component feature is added to the public API.

Component design stylesheets are linked only from the collection’s thirty-two
routes and declared as its dependencies for comparison evidence. Changes follows
the actual rendered CSS references. The styles remain watched for reloads;
excluding them from global `review.sharedImpact` avoids unrelated dependency
evidence. A regression suite checks all six shared stylesheets and the
further-scoped controls stylesheet against the real configuration, generated
manifest, and rendered resource graph.

The recorded tokens and responsive rules live in the
[shell design contract](../../docs/protocol/mokabook-shell-design.md); component
routes, fixture relationships, mask geometry, and delivery status live in the
[component design contract](../../docs/protocol/mokabook-component-design.md),
[inspector design](../../docs/protocol/mokabook-component-inspector-design.md),
[controls design](../../docs/protocol/mokabook-component-controls-design.md), and
[workspace design](../../docs/protocol/mokabook-component-workspace-design.md).

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
snapshots only after a comparison option is selected. Links inside the design frames navigate between authored artboards; their
pictured comparison controls do not request actual comparison snapshots. There is no separate Review
section or comparison CLI command.
