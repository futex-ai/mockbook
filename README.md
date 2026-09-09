# Mokabook

Mokabook turns React-authored mobile and desktop mockups into committed static
HTML, serves the resulting catalogue during development, and compares screens
with their Git baseline on demand. It is app-independent: product screens, component libraries,
themes, styles, and compatibility adapters stay in the consuming repository.

The public [npm package](https://www.npmjs.com/package/mokabook) and executable
are both named `mokabook`. Releases remain pre-1.0 while the consumer contract
settles.

## Use Mokabook

Install Mokabook and its React peers in the repository that owns the screens:

```bash
npm install --save-dev mokabook react react-dom
```

Create `mokabook.config.ts`:

```ts
import { defineConfig } from "mokabook";

export default defineConfig({
  colorSchemes: ["light", "dark"],
  repoRoot: ".",
  entriesDir: "docs/mockups/src/entries",
  mockupsDir: "docs/mockups",
  renderer: "docs/mockups/src/renderer.tsx",
  stylesheets: [{ match: "app/**/*.html", stylesheets: ["app.css"] }],
  review: {
    base: "origin/main",
    outDir: ".context/mokabook-review",
    sharedImpact: ["src/components/**", "src/tokens/**"],
  },
});
```

An entry module ends in `.mockup.ts` or `.mockup.tsx` and exports `mockups`:

```tsx
import { defineCollection, defineScreen, MockLink } from "mokabook";

export const mockups = [
  defineCollection({
    id: "account",
    title: "Account",
    description: "Account product screens.",
    childIds: ["account-home"],
    relatedDocs: ["docs/account.md"],
    dependencies: ["src/account"],
  }),
  defineScreen({
    id: "account-home",
    title: "Account home",
    description: "The account landing screen.",
    route: "account/home.html",
    mobile: (
      <MockLink fragment="summary" to="account-detail">
        Details
      </MockLink>
    ),
    desktop: (
      <MockLink fragment="summary" to="account-detail">
        Details
      </MockLink>
    ),
    relatedDocs: ["docs/account.md"],
    dependencies: ["src/account/home.tsx"],
    useCaseIds: [],
  }),
];
```

`mobile` and `desktop` accept any React node; real screens usually wrap their
content in a `<main>` landmark because each fragment is generated as its own
standalone page. Collection membership is also the navigation hierarchy:
Mokabook infers the screen's `Account` breadcrumb from `childIds`, so authors
do not maintain a separate breadcrumb path.

`MockLink` accepts a lowercase kebab-case entry id and an optional bare HTML id
through its separate `fragment` prop. The equivalent string helper is
`mockLink(id, fragment?)`; both produce `mock:<id>[#fragment]`. Raw complete
logical values remain available for an HTML/SVG link `href`, while
`data-nav-href="mock:<id>[#fragment]"` records metadata without inventing an
interaction. Generated files retain portable relative links, so standalone and
comparison snapshots continue to work. In Browse, an eligible link opens the
destination's canonical catalogue page, carries its fragment, and reveals the
active item in the navigation tree. Untyped JavaScript calls are validated at
runtime as well: ids and fragments must be strings before their respective
grammars are applied.

```tsx
import { mockLink } from "mokabook";

const detailsHref = mockLink("account-detail", "summary");
// "mock:account-detail#summary"
```

To use a styled control as a catalogue link, opt into `MockLink asChild`:

```tsx
<MockLink asChild to="account-detail">
  <button className="primary-action">View account</button>
</MockLink>
```

Mokabook adapts that one rendered control into a native link during the build,
preserving its classes, inline styles, label, and icons. Custom components may
render an HTML `a`, `button`, `div`, or `span`; put attributes on the child,
which must have no interactive descendants. Disabled or busy controls remain
inactive, and adapted links receive a visible keyboard focus outline. The
default `MockLink` behavior and documents without child links keep their bytes.
Navigation works in Browse, use-case frames, standalone files, and Review
snapshots through the existing link mechanism, without a consumer click script.

Keep any props your component requires to render enabled; Mokabook handles the
destination through the generated link. Native browser button chrome and
JavaScript-driven hover/pressed effects are not reproduced by static adaptation.
See the [styled link controls contract](./docs/protocol/mokabook-link-controls.md)
for supported markup, inactive states, and validation rules.

Color-scheme adoption has two steps: enable `colorSchemes: ["light", "dark"]`
in the config, then select the consumer theme from `input.colorScheme` in the
configured renderer. Mokabook re-renders the same mobile and desktop nodes for
dark output; authors do not duplicate screen trees. A deliberately light-only
screen opts out in either `defineScreen` or a nested `screen` marker:

```tsx
defineScreen({
  // Other screen fields stay unchanged.
  colorSchemes: ["light"],
});
```

Light-only catalogues omit `colorSchemes`, keep their existing renderer, and
produce the same fragment names and manifest bytes as before.

Run the CLI through a local dependency or directly with npx:

```bash
npx mokabook                         # build, serve, and watch
npx mokabook serve --no-watch --port 0
npx mokabook build
npx mokabook check
```

Options follow the command, so an explicit config is
`npx mokabook build --config path/to/mokabook.config.ts`. With a local
development dependency, `npx --no-install mokabook` guarantees npm does not
fall back to the registry. After the first release, a clean machine may use
`npx --package mokabook mokabook` without adding a dependency.

| Command              | Outcome                                                   |
| -------------------- | --------------------------------------------------------- |
| `mokabook`           | Build, serve, and watch using a stable development URL    |
| `mokabook serve`     | Serve the catalogue and on-demand diffs; watch by default |
| `mokabook build`     | Validate and transactionally write generated output       |
| `mokabook check`     | Compare expected and committed bytes without writing      |
| `mokabook --help`    | Show commands and their supported options                 |
| `mokabook --version` | Print the installed package version                       |

Serve starts at port `4173`. If that port, or a concrete `--port` value, is
already occupied, Mokabook tries each following port in order until one is
free. `--port 0` instead asks the operating system to choose a free port.
Watched Serve keeps the first resolved port for later child restarts so its URL
stays stable.

`build` writes one fragment per effective viewport and color-scheme view plus
`mokabook-manifest.json` under `mockupsDir`. `check` calculates those bytes
without writing and reports missing, stale, or orphan generated files. Browse
serves the package-owned Mokabook shell — resizable desktop catalogue
navigation with folder/screen/flow icons and an All/Changes filter, search that
narrows the tree by page ID, title, route, and `tag:` terms that the field's tag
picker and the details inspector's chips enter for you, hierarchy-derived
breadcrumbs with hash-prefixed copyable ID chips, realistic browser chrome with
an expand-to-overlay toggle, phone chrome whose screen reserves a clock,
signal, Wi-Fi, and battery status band above the mobile fragment, header
viewport controls, a Light/Dark switch when the catalogue has dark fragments,
use-case flows, a collapsed-by-default details inspector that remembers its
disclosure across routes and reloads, id redirects, and watched updates. The
Changes filter compares
an explicit projection of route-level manifest metadata, collection ancestry,
generated fragments, and explicitly declared dependencies with the branch
point shared by `HEAD` and the configured Git base. Collection ancestry comes
from real `childIds` relationships; compatibility-only `navPath` labels are
excluded. Commits added only to the base branch after divergence do not appear
as branch changes; staged, unstaged, and untracked workspace edits still do. A
registry module that defines many routes does not make every route appear
changed merely because the module's imports or composition changed.
Lightweight watched updates recompute this route snapshot before notifying the
browser, so the Changes rows and count match the files that triggered each
reload without restarting the server child.
Served `/static/` files use `Cache-Control: no-store`, so a watched reload reads
the rebuilt fragments and resources even when their URLs remain unchanged.
Every structured screen has a compact Current / Side by side / Overlay /
Difference control. It is available from All and Changes, and starts in Current.
During development, Mokabook generates comparison snapshots only after a diff
option is selected; browsing, filtering, and watched reloads do not trigger
generation. Published catalogues prepare snapshots during publishing, then load
and render them only after a diff option is selected. Comparisons
stay in the same screen, with mobile/desktop and light/dark controls, secondary
impact evidence, and a refresh option. Loading and failure states keep the
catalogue available and offer a retry. Navigation and reload return to Current.
Added and removed screens show explicit missing sides, and unchanged screens
can still be compared from All. Shared-impact files keep affected screens in
Changes even if their generated fragments are unchanged.

The comparison engine retains the Git branch-point baseline, ignored-region
rules, and isolated snapshot dependencies. Overlays use 50% opacity; Difference
uses CSS blending, without inventing pixel measurements. Immutable generations
keep snapshots coherent during refresh, retain replaced resources briefly, and
drain generation work before shutdown. The former Review tab, standalone report,
`mokabook review` command, and `--out` option have been removed.

Consumer documents run in sandboxed frames. Comparisons keep unmodified base/head
documents in separate snapshot trees and copies their referenced local CSS,
fonts, and images so comparison artifacts do not depend on the live workspace.
Filesystem-backed Browse and comparison routes reject malformed encoding,
traversal segments, absolute paths, and forward or backslash separators
introduced by decoding one original URL segment before resolving a consumer
file.
Base resources must use portable relative URLs or explicit HTTP(S)/data URLs;
root-absolute, protocol-relative, and unsupported-scheme URLs fail comparison.
Browse authenticates catalogue-link metadata only on current manifest-owned
generated fragments and legacy pages. It reads only each shell-owned frame's
immediate same-origin document, while scripts, forms, downloads, popups, and
top navigation remain unavailable to consumer content and nested frames.
Copied base resources must be regular Git files outside configured source roots.
Inside a fragment, use `MockLink` for catalogue destinations; root-absolute and
logical screen routes are not portable links in generated static files. Build
and check rewrite and validate every supported `href` and `data-nav-href`, plus
local HTML resource attributes and transitive CSS URLs. Watched Serve keeps its
resolved port, transactionally reloads a changed consumer config with a ready
replacement watcher, and serially replaces a child that exits unexpectedly
after readiness. A watched child also closes its server when the parent IPC
channel disconnects. Header-proven generated output plus package-owned
dependency, build, test, comparison, and transaction paths are pruned even when a
custom rule watches the repository root; an unowned public HTML file can still
use an explicit watch rule, and configured stylesheets retain reload
precedence. Shutdown interrupts replacement-watcher readiness, closes the
candidate before draining the remaining lifecycle, and waits for child exit
through graceful, terminate, and force-kill stages. Every served catalogue shell records the update version
captured when its request begins. Open shell pages compare that
snapshot with the versioned event stream and reload after a newer build or
asset version arrives, including when the build completes before the initial
stream connection. Publishing a reload-only watch update invalidates the comparison cache; another
explicit diff selection regenerates it. A
watched reload restores Browse search, filter, current and pre-filter collection
disclosures, viewport, drawer, and scroll state once on the same durable URL.
Browse also retains each history entry's latest document position for Back and
Forward. While Changes filtering is active, route changes preserve collections
the user collapsed and open only the destination's ancestor path. Editing the
search or filter reveals its current matches. Clearing all filtering restores
the earlier disclosures, except that a navigated destination's path stays open.
A rejected config or failed candidate build leaves the last-good watcher,
output, and child active.

## Configuration

Mokabook discovers `mokabook.config.ts`, `.mts`, `.js`, or `.mjs` by walking
upward from the current directory. Every filesystem path is relative to that
file and confined to `repoRoot`.

- `entriesDir` and `mockupsDir` select structured source and generated output.
- `colorSchemes` defaults to `["light"]`; `["light", "dark"]` enables dark
  fragments catalogue-wide, with per-screen light-only opt-outs.
- `renderer` and ordered `stylesheets` keep product themes and CSS
  consumer-owned. A stylesheet rule may append `lightStylesheets` or
  `darkStylesheets` after its shared list for the matching output.
- `moduleResolution` configures package roots, aliases, export conditions,
  package fields, file extensions, and esbuild loaders for cross-platform
  component trees.
- `legacy` opts into `.source.*` pages, component expansion, route aliases,
  excluded migration sources, and generic lints.
- `watch` classifies additional consumer inputs after proven package-owned
  ignores and configured stylesheets; this includes authored static HTML under
  `mockupsDir`. `review` selects the Git base ref used to find the branch point,
  internal snapshot directory, and shared-impact globs.
- `compatibility.readManifestV2` reads Accounting's old manifest only when v3
  is absent. A temporary `compatibility.transformer` may deterministically
  repair already-authored documents during a consumer cutover; final links,
  resources, and the comment-safe generated source proof are still validated.

Use `MockLink` for catalogue destinations. Raw relative links remain suitable
for real static assets and legacy documents, but logical screen/use-case routes
do not name generated files in schema v3.

## Rendering Boundary

The default renderer produces neutral static HTML. A consumer renderer can wrap
the React node in its theme/context and return a complete document. Accounting,
for example, will keep React Native Web style collection in that adapter rather
than making React Native Web a Mokabook dependency.

Entries, the renderer, and legacy TypeScript sources are bundled into one
build-time graph. React and React DOM resolve from the consumer config location,
which prevents duplicate React instances even when the executable came from an
npx cache. See [the build pipeline](./docs/architecture/build-pipeline.md) for
the complete raw-React-to-static-HTML flow.

The configuration module itself is also bundled from its own directory, so
imports of consumer workspace packages resolve before the temporary config
module is evaluated.

Consumer module-resolution overrides are explicit and contain no React Native
or app defaults. `packageRoots` must identify in-repository directories with a
`package.json`; Mokabook searches their `node_modules` directories while still
forcing React peers to the consumer's one runtime.

## Troubleshooting

- **No config found:** run from the consumer repository or pass `--config`
  after the command.
- **A generated file is stale:** run `mokabook build`, inspect the diff, then
  rerun `mokabook check`.
- **Mokabook refuses an overwrite:** the existing HTML lacks a valid Mokabook
  ownership header. Current headers encode their source identity so every valid
  repository filename remains safe inside an HTML comment. Move an unowned file
  or choose a non-colliding route; the tool will not delete authored output.
- **A package or React peer cannot resolve:** install React/React DOM in the
  consumer and configure the correct `moduleResolution.packageRoots` for a
  nested npm workspace.
- **A link fails validation:** use `MockLink` for an entry id and a relative URL
  for a real generated/static file. Root-absolute and source-tree links are not
  portable.
- **A watched edit fails:** fix the reported candidate build/config error. The
  last-good server remains active and adopts the next valid change.

## Developer Setup

The repository requires Node.js 22.14 or newer, npm 11, and Rust 1.95 for its
repository tasks.

```bash
npm ci
npm run build
npm test
npm run test:browser
npm run example:build
npm run example:check
cargo xtask check
```

For local development after installing dependencies, run:

```bash
npm run dev
```

This builds the local CLI and starts the example catalogue with watching enabled.
Open the printed URL, starting at `http://127.0.0.1:4173`. Edits to example
entries, the renderer, and configured stylesheets update the catalogue
automatically; generated HTML is written to `examples/basic/generated/`.
Use `npm run dev -- --port 0` to let the operating system choose a free port.
Restart the command after changing Mokabook's own `src/` files or other unwatched
inputs such as `examples/basic/theme.ts`; the CLI is rebuilt on every start.

`npm run test:browser` drives the catalogue shell and on-demand screen comparisons
in Chromium via Playwright; it uses the installed Chrome channel by default and
honors `PLAYWRIGHT_CHANNEL` for an alternative browser install. Parallel
workspaces can set `MOKABOOK_PLAYWRIGHT_PORT` to an available port.
Tests using the real Git-backed comparison fixture await its final JSON response
before applying UI assertion deadlines. Cold snapshot generation has a bounded
30-second wait tied to the newly triggered request, refresh intent, and its
redirect chain; stale/background responses cannot satisfy it. The existing UI
assertions retain their default deadlines.

`cargo xtask check` is the authoritative local gate. It includes formatting,
lint, typechecking, unit/integration tests, the committed example, package
allowlist and license checks, clean packed ESM/NodeNext/npx/Accounting/Juno
consumers, Chromium tests, and all Rust checks.

## Preview Deployments

`npm run preview:build` turns the real `examples/basic` Browse catalogue into a
static Cloudflare Pages artifact at `.context/mokabook-preview`. It snapshots
every catalogue route through Mokabook's HTTP server, copies the package shell
and adapted public example assets, preserves id redirects, and excludes the
development-only live-reload connection. Static routes authenticate the same
generated link markers as served Browse, and a single validated `fragment`
query is applied progressively to current and light/dark frame sources. The
snapshot compares the catalogue with `origin/main`, so Browse includes its
All/Changes filter even when the changed count is zero. The artifact is not
part of the npm package. Published screens include the same Current / Side by
side / Overlay / Difference controls as development. Publishing packages the
validated Git comparison and its isolated before/after resources; browsers fetch
them only after a diff selection. Removed screens retain their Changes rows and
comparison pages. Refresh reads the currently published comparison, and a new
deployment publishes new snapshots. A failed comparison prevents deployment and
preserves the previous local artifact.

The Preview workflow deploys `main` to the Cloudflare Pages project `mokabook`
at `https://mokabook.pages.dev`. Same-repository, non-release pull requests use
the stable `pr-<number>` branch alias at
`https://pr-<number>.mokabook.pages.dev`; a sticky `<!-- mokabook-preview -->`
comment reports the deployment status and link. Preview checkouts retain full
Git history so `origin/main` and route-level changes can be resolved. Closing a
pull request marks that comment inactive and attempts to remove its
deployments. Fork pull requests do not receive Cloudflare credentials, and
Release Please pull requests are skipped because their source changes were
already previewed.

Maintainers must create the direct-upload Pages project with `main` as its
production branch, then configure repository variable `CLOUDFLARE_ACCOUNT_ID`
and repository secret `CLOUDFLARE_PAGES_API_TOKEN` (or
`CLOUDFLARE_API_TOKEN`). The token needs Pages write access for deploy and
cleanup operations.

```bash
npx --no-install wrangler pages project create mokabook --production-branch main
```

## Releasing

Changes use Conventional Commits. On `main`, release-please maintains the
reviewed version/changelog PR; merging that PR creates an immutable `vX.Y.Z`
release. The same [Release workflow](./.github/workflows/release.yml) checks the
tag, reruns the full gate, packs and smoke-tests the exact tarball, guards an
already-published version, and publishes through npm trusted publishing. A
bounded post-publish check tolerates npm metadata, tarball, dist-tag, and
signature propagation before proving the registry artifact. A manual
`publish_ref` retries only an existing tag. See the
[release protocol](./docs/protocol/npm-release.md) for the one-time `0.0.0`
bootstrap and maintainer settings; do not add an npm write token to GitHub.

The synthetic fixture at [`examples/basic`](./examples/basic/README.md) proves
custom rendering, stylesheets, id links, collections, use cases, and
Review-ignore markers without importing an application. Its screens use
`@firna/ui` through a react-native-web renderer adapter, so the example also
proves the consumer contract against a real cross-platform component stack.
Its `Design` catalogue holds the approved catalogue and Changes mockups
recorded by the
[shell design contract](./docs/protocol/mokabook-shell-design.md).
The [component design catalogue](./docs/protocol/mokabook-component-design.md)
adds thirty-one mobile and desktop references for component pages, screen
inspection, a collapsible icon inspector, and the complete prop-controls states.
The [controls designs](./docs/protocol/mokabook-component-controls-design.md) show
saved variants and temporary edits; live preview rendering remains a later
implementation milestone. The catalogue hierarchy reaches each design without
adding navigation footers to the artboards.

The design mockups use `MockLink` for supported navigation and state transitions;
the two example buttons demonstrate `MockLink asChild`. See the
[design mockup links contract](./docs/protocol/mokabook-design-links.md) for
canonical destinations and the controls that remain visual depictions.

### Key Code

- [`src/index.ts`](./src/index.ts) — supported public authoring API.
- [`src/config`](./src/config) — config discovery, loading, and confinement.
- [`src/build`](./src/build) — single-graph bundling, compilation, links, check,
  and transactional writes.
- [`src/server`](./src/server) — manifest-backed HTTP, the responsive shell,
  and the watched child lifecycle.
- [`src/client`](./src/client) — progressive Browse navigation and versioned
  live updates served to the browser.
- [`src/navigation`](./src/navigation) and [`src/browse`](./src/browse) — shared
  logical-target grammar and ownership-aware HTML adaptation.
- [`src/review`](./src/review) — Git extraction, comparison, ignore normalization,
  and isolated comparison snapshots.
- [`src/legacy`](./src/legacy) — opt-in migration sources and component expansion.
- [`xtask`](./xtask/README.md) — full repository checks and post-push review.

### Related Docs

The planned [registered components contract](./docs/protocol/mokabook-components.md)
links to the [change attribution](./docs/protocol/mokabook-component-changes.md),
[pages and inspection](./docs/protocol/mokabook-component-explorer.md), and
[local prop controls](./docs/protocol/mokabook-component-controls.md) contracts.
These features are not implemented yet; delivery is tracked in the
[plans index](./plans/README.md).

- [Protocol index](./docs/protocol/README.md)
- [Package ownership boundary](./docs/architecture/package-boundary.md)
- [Accounting migration inventory](./docs/migration/accounting-framework-inventory.md)
- [Styled control migration guide](./docs/migration/accounting-link-controls.md)
- [Implementation plans](./plans/README.md)
