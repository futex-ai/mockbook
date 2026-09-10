# Shared Design Components

These fifteen registered components render both Mokabook's design artboards and
the independent pages under **Design → Shared components**. The footer tabs
panel is `inspector/inspector`. This is the consumer's mockup library; the actual
Mokabook browser shell remains in the package source.

## Authoring

For each component, `{group}/{slug}.tsx` declares its typed schema, slots, saved
variants and supported controls. `{slug}.view.tsx` implements its markup.
`library.mockup.ts` registers the entries in four flat gallery collections.

Call the registered `.Component` from screen adapters. Never import a `.view`
module into a screen or create a second standalone implementation. Leave whole
screens, stage/workspace layouts and fixture selection as ordinary composition.

Pass actual screen data at the boundary: labels, destinations, query, selection,
status and counts. Slots hold caller-owned JSX, including previews, inspector
bodies and native inputs. Resolve scenario navigation in an adapter before
calling a component; missing destinations stay non-links.

Use explicit semantic `mokabookInstance` names for repeated siblings. The
`DesignInstances` context supplies a stable prefix for simultaneous viewport
regions. Flow-step names must be independent of destinations or ordering.
Input ids, label associations and description/error ids belong to the form caller;
the prop-field component supplies framing and matching description/error nodes.

Components may compose registered children. Top bar → Tag picker → Tag chip
records the full nested ownership chain. Components supplied in a caller's slot
retain that caller's ownership.

## Styles And Hosts

`metadata.ts` declares exact ownership of a component's `.view.tsx` module and
`generated/design-library/{group}/{slug}.css`. Keep registration, saved fixtures,
controls metadata, shared helpers and navigation tables out of those dependencies.
An example-only edit must not report implementation impact on every consumer.

Each view calls `useDesignStyle(slug)` when it renders visible owned markup.
`style_files.ts` supplies the ordered candidate pool to the example configuration.
The configuration orders shared base styles first, requested component sheets
next, then context/layout overrides. Keep this explicit order: equal-specificity
mobile rules must not override bounded workspace scrolling.
`style_context.tsx` creates a fresh collector for each normal or transient render,
retains configured relative URLs and shared sheets, and emits only requested
exclusive sheets. Missing configuration fails explicitly. A hidden picker does
not link chip CSS merely because another variant uses chips.

Only exclusive selectors belong in an owned stylesheet. Tokens, resets, mixed
selectors and cross-component layout/state rules stay in the shared design CSS.
Keep configured watch paths in sync when introducing an owned sheet.

`host.tsx` supplies standalone layout and semantic parents without fixture data.
The icon inspector uses the ordinary preview workspace for its resizer; the
legacy disclosure renders outside that icon panel dock. Inline samples retain
intrinsic width. Compact phone samples fit both viewports; full-size controls
use the scrollable frame host. Every variant has actual mobile and desktop
render contexts and uses the design catalogue's light-only scheme policy.
Mobile comparison controls share compact sizing across buttons, links and
static labels, so standalone samples also fit with wider system fonts.

## Verification

From the repository root:

```sh
npm run build
npm run example:build
npm run example:check
npm run typecheck
node --import tsx --test tests/design_library*.test.ts tests/design_library*.test.tsx tests/component_design_attribution.test.ts
npx playwright test tests/browser/design_library*.spec.ts
cargo xtask check
```

Open changed generated fragments directly from disk in both viewports. Check
saved variants and local edit/unset/reset behavior in Serve, plus read-only
inspection after export. Commit the generated HTML and manifest with the source.

The tests retain the original 56 screen ids/routes, assert real consumers and
owner chains, guard migrated composition points, and edit actual source files in
isolated copies. They distinguish implementation changes, saved metadata changes,
screen inputs/slots/order, exclusive CSS and conservative global dependencies.
Serve and comparison share the same classification and bounded baseline reads.
The full-consumer export browser suites give setup three minutes to prepare
the baseline, export all 248 views and verify input stability.
Individual browser interactions retain the default one-minute limit; this setup
allowance does not change any server readiness deadline.

See the [adoption contract](../../../../../docs/protocol/mokabook-design-components.md)
and [inventory](../../../../../docs/protocol/mokabook-design-component-library.md).
