# Component Workspace Design

## Delivery Status

Milestones 4c and 4f of the [component explorer plan](../../plans/component-explorer.md)
revises the existing component, controls, and consuming-screen artboards after
design feedback. It changes the mockups; the package-owned runtime remains a
later milestone. The existing owning routes and mobile/desktop screen components
remain the review entry points.

## View Controls

Place one compact icon toolbar beside the page title. It contains a native
viewport dropdown (Mobile, Desktop, Both), a light/dark toggle, and, on consuming
screens, a Highlight components toggle. Do not repeat the theme control in the
top bar or give highlighting a separate horizontal band. Icons have accessible
names, hover tooltips, selected states, and visible keyboard focus.

The viewport dropdown switches the actual displayed preview contexts. Both shows
both mobile and desktop, with labels identifying each. Desktop content retains
its layout width when the available pane is narrow; scrolling happens inside the
preview pane instead of scaling the document or widening the outer page.
Theme changes affect the preview and its context labels, leaving the application
chrome legible. View changes preserve the selected variant and edited fields.

Native form state and scoped CSS make these mockup controls work without scripts,
including inside Browse's sandboxed frames. Preview fragments are authored from
the same fixture values for both contexts. They do not implement server rendering
of newly entered prop values. Highlighting uses the fixture's existing overlay
geometry and never dims an ancestor of a highlighted component.

Disable highlighting when no registered components exist, inspection is
unavailable, or a comparison is selected. The tooltip and accessible description
state that specific reason; zero usage must not be confused with missing data.
Highlight labels are separate rounded chips with a small gap above an intact
rounded outline. The chip must not overlap the outline's corner or obscure the
component; apply the same treatment to outer, nested, and single-instance regions.

## Fixed Shell And Resizable Inspector

The artboard fills its viewport. Its top bar, screen title, view toolbar, saved
variants, and comparison controls remain outside scrolling content. The enclosing
page and main column have no vertical scrollbar. The preview and inspector are
sibling panes; their contents may scroll independently without an enclosing
scroll region. The inspector's icon strip stays visible while its content scrolls.

An open inspector is vertically resizable at the divider below the preview. The
mockup uses the browser's native resize grip at the lower-right corner of the
preview pane. Dragging changes the space shared with the inspector. Both panes
have minimum heights, and resizing cannot push the tabs or content outside the
shell. Closing the inspector returns its space to the preview. Reopening restores
the split, clamped to the available viewport. The future runtime divider supports
dragging across its full width and keyboard resizing with appropriate separator
semantics; the native mockup grip does not replace that implementation.

Mobile follows the same bounded shell and pane ownership. Content can scroll
inside the active inspector; scrolling it must not move the page title or tabs.
No nested page/panel scrollbar should be needed to reach the last field.

## Nested Components

A component can render other registered components. On its page, the inspector
tab is named Nested components and lists those children, excluding the component
whose page is open. Toolbar demonstrates its nested Action instance. Leaf
components, including Action, omit this tab. Screen pages retain their Components
tab, including the existing explicit empty and unavailable states.

## Comparison Availability

All is a catalogue filter, not evidence that the selected example changed.
Known examples show Added, Changed, Removed, or Unmodified beside the title,
using the selected entry's comparison state. Unmodified examples retain
their current preview with no comparison mode row. Changed, added, removed,
or affected examples retain the relevant comparison controls. Temporary prop
edits never create committed changes or make comparison controls appear.

Normal component/control fixtures depict an unchanged saved example and zero
catalogue changes. Changed component, independent screen change, and removal
fixtures retain their explicit Changes counts and before/current presentation.
Missing inspection metadata is distinct from comparison availability.

The runtime uses actual comparison eligibility for the selected saved example.
Unknown/pending evidence must not be presented as Unmodified, and controls cannot
trigger eager screenshot work merely to decide whether to show a mode row.
Affected consumers may still expose comparisons while staying out of Changes.

Entry status and variant status are distinct. Removing Compact from Action is
a Changed component with a Removed variant; Farewell is a Removed screen.
The Added Badge example lives in States → Additions and shows a missing Before
side, a current saved preview, and one Changes entry. The existing unused Badge
example remains Unmodified. Status must never be inferred from usage counts.

## Comparison Details

Name the information icon Details. Keep comparison evidence, when present,
inside this panel alongside description and secondary source metadata. Do not
add a comparison disclosure below the canvas or a separate explanatory banner
above it. The panel is available on removed-screen comparisons too. Unmodified
examples omit the comparison section.

Use structured evidence: entry/variant state, a generic output-change reason,
paired prop values, and links to changed components actually used by the screen.
Prop rows identify their component instance and show Before and Current values.
The mockup fixtures share these values with the rendered preview and Props panel.
Do not invent explanations such as “corners and spacing changed”: the runtime
can populate factual rows from validated comparison/usage records and paired
inputs, but does not generate visual-analysis prose. Temporary control edits
remain separate from saved comparison evidence.

## Verification

Capture regressions before implementing the changes. Exercise native viewport,
theme, and highlight controls from disk and inside served frames. Verify both
rendered contexts, independent mask ids, correct labels, retained control values,
leaf/composite tab membership, and explicit comparison eligibility.

Use pointer dragging to resize the inspector; check bounds, closing/reopening,
and document/main/inspector scrolling separately at mobile and desktop sizes.
Keep existing link, prop, usage, highlight-geometry, and Changes-count assertions.
Open and visually inspect every changed artboard and the interactive Both/Dark
states. Regenerate with `npm run example:build`, verify with
`npm run example:check`, and run `npx playwright test tests/browser/component*.spec.ts`.
Finish with `cargo xtask check`, commit/push, and the post-push review.
