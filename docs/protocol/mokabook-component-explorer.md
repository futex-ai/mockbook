# Component Pages And Screen Inspection

## Delivery Status

Approved target, not implemented. The [component explorer plan](../../plans/component-explorer.md)
tracks delivery. This extends the package-owned
[Browse shell](./mokabook-shell-design.md); authoring and attribution are
specified in the [component contract](./mokabook-components.md) and
[component changes contract](./mokabook-component-changes.md).

The [component design catalogue](./mokabook-component-design.md) supplies the
mobile and desktop visual contract; the runtime behavior below remains a target.

## Catalogue And Component Pages

Components are a distinct entry kind in the existing navigation tree, with a
component icon and the same All/Changes filter, count, search, tags, breadcrumbs,
id chip, and responsive navigation. Collection membership remains the hierarchy;
a separate explorer application or automatically invented Components folder is
not required. The example catalogue should provide an authored Components group.

A component page contains its title, description, selected saved variant,
preview canvas, viewport/theme selectors, comparison controls, and an icon inspector.
The canvas uses the consumer renderer and gives a small component suitable
space without implying it is a whole phone screen. Mobile/desktop still select
distinct viewport contexts; controls must not fake scaling or modify consumer
props to fit. Long or full-width components remain inspectable by scrolling.

Saved variants are selectable by name. One component page shows one selected
variant at a time; variants are not independent Changes rows. A validated
`variant` query parameter makes the selection linkable and preserves it through
Back/Forward. No parameter selects the first variant. Unknown or duplicate
values produce a clear selection error with valid variants still accessible.
Viewport/theme changes retain the variant, applying existing light-only rules.

Current / Side by side / Overlay / Difference operate on the selected saved
variant and viewport/theme. Changing variant while comparing uses that variant's
comparison; late responses cannot replace a newer selection. Added/removed
variants have explicit missing sides. Page navigation and reload start in
Current, as screens do today. Saved variant selection and comparison are fully
usable in served and published catalogues.

`MockLink` and id redirects can target a component's default variant using the
existing logical-id contract. Generated standalone links resolve to the default
variant's viewport/theme fragment. Variant selectors and Used by links are
shell-owned URLs; do not overload the existing logical fragment grammar with
component prop JSON or variant suffixes.

The shared inspector has Info, Components, Props/Controls, and Usage icons.
Clicking an icon opens its panel or switches the open panel; clicking the active
icon or Close collapses it. With no panel open, no icon is selected. Info contains
source/docs/tags/dependencies, Props contains the supplied values, and Usage
contains Used by screens/components derived from current usage. A changed
component also exposes Affected screens from baseline/current evidence. Removed
consumers link to their retained comparison view. Lists distinguish direct and
transitive use and show actual instance/view counts without counting reused flow
frames as additional screen uses. Empty lists have explicit empty states. The
[inspector design contract](./mokabook-component-inspector-design.md) defines the
shared layout and native mockup behavior; runtime keyboard focus and Escape
handling belong to the shell implementation.

## Components In The Screen Inspector

Every registered screen uses the same icon inspector. Its Components panel
lists actual instances for the active viewport and scheme, grouped by component,
with nested relationships and readable instance labels. Selecting an instance
opens Props with supplied data, slot references, and links to its component page.
Unrendered conditional branches do not appear; null-rendering instances are
listed without a visible region. An empty usage set says no registered components
are used in this view. Legacy/missing metadata says inspection is unavailable.

Repeated instances remain individually selectable. Nested component groups start
collapsed and can be expanded to inspect inner instances. Selecting an instance
reveals its props and allows opening the canonical component page without
losing the screen's navigation history. Raw source paths and identifiers remain
secondary metadata; visible labels use the component title and instance label.

Selecting a component-page Used by link opens the owning screen in Current,
sets its recorded viewport/theme, and opens its selected instance in Props. Multiple
matching occurrences remain selectable. Route query values reference validated
manifest identities and cannot introduce arbitrary DOM selectors or file paths.

## Highlight Components

The screen toolbar gains a keyboard-operable Highlight components toggle with
an accessible pressed state. It starts off. In Current, enabling it dims the
surrounding screen while registered component regions retain their original
appearance. Outlines and labels identify visible regions; selecting a region
selects the corresponding instance and opens Props if needed.
Selecting a Components entry highlights and scrolls its instance into view.

Initially highlight outermost visible component boundaries. Selecting or
expanding a nested entry focuses that instance so a large shared container does
not make every nested control indistinguishable. At a nested depth, nonselected
content is dimmed again. Sibling or repeated instances remain independently
selectable through outlines and the accessible Components list.

Implement highlighting as shell-owned presentation over validated live DOM
ranges, with dimming-mask cutouts for the selected regions. Do not set opacity
on a consumer ancestor and try to restore opacity on its descendants. Do not
clone component DOM, change its position, insert layout wrappers, or alter its
computed styles. Component pixels, layout, and original opacity remain intact.

Bounds come from the active generated document, support multi-root/text ranges,
and follow scroll, nested scroll containers, frame resize/expansion, fonts/images
loading, and viewport/theme swaps. Clip to the visible frame and its clipping
ancestors; do not highlight unrelated content covered by occluding elements.
Zero-area/hidden instances remain inspectable in the inspector without an invented
rectangle. Unsupported boundaries report unavailable inspection explicitly.

While the toggle is on, selecting outlined regions inspects them rather than
following their product links. Normal frame navigation is restored when it is
off. Escape exits inspection and returns focus to the toggle. Selection is
exposed through the Components list so neither hover nor pointer precision is
required. Labels must not rely on color alone.

Turning off highlighting removes all masks/listeners and returns the unmodified
screen. Route changes and reload turn it off and clear stale instance selection.
A viewport/theme change rebinds usage to the new document; preserve a selection
only if its identity still exists. Entering a comparison turns highlighting off;
its toggle is unavailable in comparison modes, whose snapshots stay unmodified.
Component-page nested inspection can reuse this same mechanism.

## Frame And Publishing Boundary

Only package-owned shell code inspects its immediate, same-origin, authenticated
generated frame. Component metadata extends the existing Browse ownership
validation. Arbitrary legacy documents, nested frames, and comparison snapshots
receive no new inspection privileges. Consumer scripts, forms, popups, and top
navigation remain disabled; do not loosen frame sandbox policy for this feature.

Publishing copies the same validated usage metadata and package-owned inspector
code, so saved variants, inspector panels, backlinks, and highlighting work without a
development server. Standalone generated fragments retain normal content and
portable links; they do not require the interactive inspector. Temporary local
controls are governed separately by the [controls contract](./mokabook-component-controls.md).

## Mockups And Verification

Before UI implementation, extend the existing design catalogue under
`examples/basic/entries/design` and regenerate its committed HTML. This is
Mokabook's current owning mockup tree; do not introduce an unrelated Expo app
or a second mockup generator. Provide mobile and desktop screen components for
the component page/variants, changed component/Affected screens, screen inspector
usage, highlight selection, and empty/unavailable states. The [controls designs](./mokabook-component-controls-design.md) are delivered
with the inspector revision for the same sign-off; runtime controls remain pending.

Each owning screen-spec page has at most five screens. Split additional states
into linked child pages, with a canonical screen on nonterminal pages. Reuse
existing shell/frame components and the shared inspector and link new screens from the catalogue
and related screen/component pages. Flows only compose those existing screens
and link back to their owners. Keep annotations outside rendered screen areas.

Run the repository's real example build/check and relevant tests, and open every
changed generated page directly from disk for visual verification. Browser
tests must also exercise the real served and published shell with actual usage
records, both viewport/theme modes, nested/repeated/multi-root content, scrolling,
resizing, missing metadata, selection/navigation, keyboard access, and cleanup.
