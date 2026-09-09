# Component Inspector Design

## Delivery Status

Approved design revision for Milestone 4b of the
[component explorer plan](../../plans/component-explorer.md). It replaces the
single crowded Details disclosure in component and consuming-screen mockups.
The runtime inspector remains pending. Existing non-component Browse/Changes
artboards continue to document the currently implemented shell.

## One Inspector

Component pages and consuming-screen designs share one inspector beneath the
preview. Its icon strip contains Info, Components, Props (Controls on editable
component designs), and Usage. Each icon has an accessible name, visible focus
style, and a tooltip. Only the active icon has the sage selected treatment.

Info contains the description and secondary source/reference metadata.
Components contains the nested instance tree and explicit empty/unavailable
states. Props contains the selected variant or instance's supplied values,
slot ownership, and Open component/Highlight actions. Controls replaces the
read-only props presentation where editable controls are being designed.
Usage contains Used by and, when relevant, Affected screens, with independent
screen Changes membership preserved. Never combine the entire tree, all props,
and all usage lists into one panel.

Clicking an icon opens that panel, switching directly from any other open panel.
Clicking the active icon closes it. A visible close affordance belongs to the
active disclosure and performs the same action. When closed, no icon is selected
and no panel content occupies layout space. Enter and Space activate the focused
icon; normal Tab navigation reaches icons and controls. No script is required
for the mockups' disclosure behavior. It must also work in sandboxed Browse
frames and directly from disk. The runtime implementation additionally supports
Escape and focus return as specified by the explorer contract.

Desktop panels use a bounded, scrollable content region. Mobile uses a full-width
panel with normal document scrolling, adequate touch targets, and no horizontal
page overflow. The icon strip remains separate from scrolling panel content.
Each owning artboard declares its initial panel explicitly; instance links open
the supplied-props panel for that instance. Empty/unavailable screens open the
Components panel. The canonical component page opens Info.

## Navigation And Metadata

Artboards contain no navigation footer for browsing mockup states. The existing
Design catalogue hierarchy links every owning page and its child galleries.
Saved-variant, usage, component, and instance links remain inside the depicted
product where they belong. Every `aria-current="page"` link must point to the
rendered artboard id, even when multiple states share a component/screen title.
Selection within a component or tree can use non-page current-item semantics.

Use stable fixture identities for catalogue selection. Display labels never
identify the current destination or synthesize a filename. Component fixtures
explicitly declare display name, id, source path, description, and dependencies;
render the same metadata in Info and source references.

## Owning Closed States

The existing component and inspection artboards cover open panels. A separate
bounded Inspector gallery adds closed-panel states, each with its own mobile and
desktop screen component:

| Entry id                                   | Route                                        | State                                      |
| ------------------------------------------ | -------------------------------------------- | ------------------------------------------ |
| `design-component-inspector-closed`        | `design/components/inspector/component.html` | Component with all inspector panels closed |
| `design-component-screen-inspector-closed` | `design/components/inspector/screen.html`    | Screen with all inspector panels closed    |

## Verification

Browser tests open each icon, switch and close panels, exercise keyboard focus,
verify that closed panels reserve no space, and inspect both viewport layouts.
Catalogue checks cover all owning routes and every current-page destination.
Regression tests verify explicit Help hint source metadata and the removal of
footer navigation. Preserve component highlight geometry and attribution checks.
