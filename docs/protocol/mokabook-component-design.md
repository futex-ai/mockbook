# Component Explorer Design

## Delivery Status

The component-page and screen-inspection mockups are delivered by Milestone 4
of the [component explorer plan](../../plans/component-explorer.md). Runtime
registration, attribution, and the inspector remain unimplemented. Editable
controls have their own later design milestone. These screens extend the
[shell design](./mokabook-shell-design.md) and depict the
[component explorer contract](./mokabook-component-explorer.md).

## Owning Catalogue

Source lives under `examples/basic/entries/design/components/`; generated
artboards live under `examples/basic/generated/design/components/`. The existing
Design → Mokabook design → Component explorer collection reaches every screen.
The canonical `overview` screen shows a component page, followed by links to the
owning child pages outside the artboard. Its three child collections are gallery
indexes, each with at most five direct owning screens; inspection also links a nested
selection gallery with two owning screens. Every screen has a separate
mobile component and desktop component; there are no new user-flow pages.

| Entry id                                    | Route                                                 | State                                            |
| ------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `design-component-overview`                 | `design/components/overview.html`                     | Action page, default variant, props, and Used by |
| `design-component-variants`                 | `design/components/pages/variants.html`               | Disabled saved variant                           |
| `design-component-comparison`               | `design/components/pages/comparison.html`             | Saved variant before/current comparison          |
| `design-component-affected`                 | `design/components/pages/affected.html`               | One changed component and two affected screens   |
| `design-component-toolbar`                  | `design/components/pages/toolbar.html`                | Component consuming Action                       |
| `design-component-help`                     | `design/components/pages/help.html`                   | Invoked component with no visible region         |
| `design-component-inspection-details`       | `design/components/inspection/details.html`           | Repeated instances and selected props            |
| `design-component-inspection-highlight`     | `design/components/inspection/highlight.html`         | Outermost component cutouts                      |
| `design-component-inspection-nested`        | `design/components/inspection/nested.html`            | Nested Action selected in the screen and Details |
| `design-component-inspection-direct-change` | `design/components/inspection/direct-change.html`     | Independent screen prop change; two Changes      |
| `design-component-inspection-consumer`      | `design/components/inspection/consumer.html`          | A second screen reached from Used by             |
| `design-component-inspection-toolbar`       | `design/components/inspection/selection/toolbar.html` | Selected container with its own props            |
| `design-component-inspection-help`          | `design/components/inspection/selection/help.html`    | Selected invisible instance                      |
| `design-component-empty`                    | `design/components/states/empty.html`                 | Validated empty usage                            |
| `design-component-unavailable`              | `design/components/states/unavailable.html`           | Missing inspection metadata                      |
| `design-component-unused`                   | `design/components/states/unused.html`                | Saved component with no consumers                |
| `design-component-removed`                  | `design/components/states/removed.html`               | Removed saved variant and former consumer        |
| `design-component-removed-consumer`         | `design/components/states/removed-consumer.html`      | Retained removed-screen comparison               |

Standalone files insert `.mobile` or `.desktop` before `.html`. All eighteen
screens opt into light documents, matching the existing shell mockups. They
depict the Light context and retain the shell's Light/Dark selection. Links use
the existing logical-id navigation contract so they work both directly from
disk and in Browse. State links demonstrate navigation between mockups; static
depictions of shell controls do not implement the future runtime inspector.

The shared shell retains the [existing design navigation](./mokabook-design-links.md)
for brand, home breadcrumb, and the canonical mobile drawer. Component artboards
select their own typed navigation state; they never inherit Welcome's tag,
scheme, inspector, or comparison transitions. Their viewport, scheme, comparison,
and highlight depictions retain native button focus and pressed/disabled states.
The shared selection control preserves native anchor semantics when an authored
transition exists. Existing Browse and Changes artboards retain their non-link
spans for unsupported controls.

## Component Pages

Reuse the existing top bar, navigation tree, screen heading, comparison band,
stage, segmented controls, and Details disclosure. Components use a small cube
icon in an authored Components collection. Desktop keeps the resizable navigation;
mobile keeps the compact header and adds short Screen/Components/Changes links
above the heading so the relevant destinations and change count remain visible.

The saved-variant strip follows the comparison band. The selected variant uses
a pale sage surface, border, and explicit current-link state. Default and
Disabled are one component's variants; neither creates a separate Changes row.
One canvas shows the selected variant. Mobile context is capped at 390px;
desktop context uses the available width. Canvases have a 10px radius, a light
border, a small context caption, and a centered component, without device chrome.
The same `ActionExample` and `ToolbarExample` are reused in consuming screens.

Details places description and supplied props beside Used by, with an additional
Affected screens column for changed components. Mobile stacks these sections.
Props use a definition list and monospace values. Usage rows show screen or
component titles, direct/transitive relationships, instance counts, and view
counts derived from the synthetic usage fixture. Source paths remain secondary.

The Action fixture is used twice in Welcome (directly and through Toolbar), once
in Details, and once by Toolbar's default variant. Its usage has four contexts:
mobile/desktop × light/dark. A component-only appearance edit produces exactly
one Changes row, Action; Welcome and Details appear under Affected screens.
An independent Welcome label edit adds Welcome, making two Changes rows.
The removed-state scenario also retains the former Farewell consumer and links
it to its before/current comparison. Farewell is independently removed, so
that scenario has two Changes rows: Action and Farewell. The missing current
side is explicit.

## Screen Inspection

The existing Details panel adds component groups with native disclosures,
instance counts, repeated-instance links, a selected-state treatment, supplied
props, slot/ownership details, and an Open component link. Welcome has four
instances: Toolbar, two Actions, and an invisible Help hint. Nested Toolbar
contents start collapsed and expand in the nested-selection artboard. Help hint
has an inspection entry and component page, without an invented visible region.
Toolbar and Help hint usage links lead to their own selected-instance artboards,
with the correct prompt or visibility props and Open component destination.

Highlight components is a focusable button with `aria-pressed`. The enabled
artboards show a light mask at 78% coverage with cutouts over the visible
components. Sage outlines and named labels expose the selected regions; a
nested selection cuts out only the Toolbar action and dims the parent again.
The same consumer DOM is used with highlighting off and on. The design adds
an SVG overlay, not ancestor opacity or a cloned consumer tree.

Mask geometry is fixed to the synthetic artboard's layout and tested against
its actual DOM bounds. Runtime geometry collection, selection, Escape handling,
and cleanup belong to Milestone 5. The comparison artboard disables highlighting.
An empty usage list says no registered components are used in this view;
unavailable inspection never claims a zero count. Badge has a visible saved
example and an explicit empty Used by list.

## Verification And Maintenance

Use the real generator; never hand-edit generated HTML. The three component
stylesheets are hand-authored public inputs, confined to `design/components/**`.
The component collection declares them as inherited entry dependencies, so edits
affect only its eighteen design routes. Keep them out of the global
`review.sharedImpact` list; watched stylesheet rules still reload their edits.
Shared fixtures and reusable screen parts live beside the owning screen modules.

`tests/component_design_attribution.test.ts` exercises each component stylesheet
against the real example configuration and committed manifest. It requires exact
Changes membership for the component routes, excluding unrelated design screens,
product screens, and their use case.

Run `npm run example:build`, `npm run example:check`, and
`npx playwright test tests/browser/component_design*.spec.ts`. The browser suite
opens every artboard directly from disk, checks links, selection semantics,
counts, missing states, responsive overflow, and mask geometry. Visually inspect
all generated mobile and desktop pages, including both selected-instance states.
Run `cargo xtask check` before committing and pushing, then `cargo xtask review`.
