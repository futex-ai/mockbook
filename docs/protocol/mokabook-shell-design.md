# Mokabook Shell Design Contract

## Scope

This document records the approved design for the package-owned Browse shell
and the optional in-place screen comparisons. The design is
the refined Mockbook shell originally shipped inside the Accounting repository,
ported here without any Accounting or Bookfolio content. The visual source of
truth is the design catalogue in the basic example under the `design/` routes;
this contract fixes the tokens, dimensions, and responsive behavior that
implementation and tests must preserve. Runtime behavior stays in
[mokabook-runtime.md](./mokabook-runtime.md).

## Delivery Status

This document describes the implemented shell design, including active-row
ancestor disclosure, conditional filter clearing, nearest-row scrolling, the
`tag:` search term, the details inspector's tag chips, the search field's tag
control with its picker panel, the mark-only narrow brand, and the top bar's
stacking above the navigation drawer scrim. Every state recorded here is
implemented.

## Design Mockups

The approved screens are authored in `examples/basic/entries/design/` and
generated under `examples/basic/generated/design/`:

| Route                                     | State                                  |
| ----------------------------------------- | -------------------------------------- |
| `design/browse/views/home.html`           | Catalogue home with navigation tree    |
| `design/browse/views/screen.html`         | Selected screen with framed fragments  |
| `design/browse/views/use-case.html`       | Selected use case with ordered steps   |
| `design/browse/states/details.html`       | Expanded details inspector             |
| `design/browse/states/missing-route.html` | Not-found view with navigation         |
| `design/browse/states/navigation.html`    | Collapsed navigation drawer            |
| `design/browse/states/tag-filter.html`    | Tag picker over a filtered tree        |
| `design/browse/states/dark-scheme.html`   | Dark selected, dark device screens     |
| `design/browse/states/light-only.html`    | Light-only screen under dark           |
| `design/review/outcomes/changed.html`     | Changed screen, side-by-side compare   |
| `design/review/outcomes/added.html`       | Added screen with missing base pane    |
| `design/review/outcomes/removed.html`     | Removed screen with missing head pane  |
| `design/review/outcomes/difference.html`  | Blend-mode difference comparison       |
| `design/review/outcomes/dark-scheme.html` | Dark view compared side by side        |
| `design/review/impact/shared-impact.html` | Summary with shared-impact card        |
| `design/review/impact/ignored-only.html`  | Ignored-region-only classification     |
| `design/review/impact/empty.html`         | Empty Changes filter retaining Current |

Every screen ships one mobile and one desktop variant. Mockup implementation
notes live in entry descriptions, rationale, and related docs — never inside
the rendered screen area.

## Consumer-Tunable Custom Properties

Consumers may set exactly these CSS custom properties to tune the shell accent.
The shell reads them with the defaults below; every other shell style is
package-owned and not a compatibility surface.

| Property                     | Default                   | Used for                          |
| ---------------------------- | ------------------------- | --------------------------------- |
| `--mokabook-accent`          | `#4f7864`                 | Brand mark, active pills and rows |
| `--mokabook-accent-contrast` | `#ffffff`                 | Text and glyphs on the accent     |
| `--mokabook-accent-soft`     | `rgba(79, 120, 100, 0.1)` | Hover and highlight surfaces      |

A consumer accent pair must keep at least WCAG AA contrast between
`--mokabook-accent` and `--mokabook-accent-contrast`; the shell does not
recompute contrast at runtime.

## Package-Owned Tokens

The shell chrome is light-only (`color-scheme: light`); only the inside of a
device screen follows the selected color scheme (see Color Scheme below). The
chrome family is neutral and sage-tinted:

| Token                    | Value                            | Role                     |
| ------------------------ | -------------------------------- | ------------------------ |
| `--chrome-bg`            | `#f4f4f1`                        | Application background   |
| `--chrome-surface`       | `#ffffff`                        | Cards, bars, panes       |
| `--chrome-ink`           | `#1a1d1c`                        | Primary text             |
| `--chrome-ink-2`         | `#4a4f4d`                        | Secondary text           |
| `--chrome-muted`         | `#7d8480`                        | Tertiary and labels      |
| `--chrome-border`        | `#e3e5e0`                        | Hairline borders         |
| `--chrome-border-strong` | `#c8ccc4`                        | Frame and strong borders |
| `--chrome-accent`        | `#2a4733`                        | Deep-accent prose links  |
| `--chrome-shadow`        | `0 30px 90px rgba(20,28,22,.14)` | Overlay elevation        |

Typography is **Inter** (a variable font packaged with the shell and served at
`/__mokabook/fonts/InterVariable.woff2` under its SIL OFL license) via
`--sans: "Inter", ui-sans-serif, system-ui, …` at a 13px shell base, with
`--mono: "SFMono-Regular", Consolas, …` for routes, ids, addresses, and paths.
The nav indent guides use the faint `--mbk-guide: #dbded8` tint. The shell
ships no consumer product fonts beyond Inter, and no Accounting or Bookfolio
color, name, or route family may appear in shell styles or copy.

## Layout

The shell fills the viewport (`100vh`, document scrolling disabled); every
scrollable region scrolls internally:

- **Top bar** — 48px, surface background, hairline bottom border: brand mark
  (24px rounded square in the accent with the `◫` glyph), the product name in
  its own `mbk-name` span, a centred search field (max-width 440px, `⌕` glyph)
  that flexes down to whatever room the bar leaves it, the color-scheme control
  when the catalogue has one. Below the breakpoint a menu button opens the
  catalogue drawer. The product name hides in the narrow header so the search
  retains space; the brand link keeps its accessible name. There is no mode
  switch. A query splits into terms: every `tag:<tag>`
  term matches only rows whose entry declares that tag, and the remaining words
  rejoin into one phrase that must appear in a row's authored ID, title, or
  route. A row stays visible only when it matches every tag term and that phrase;
  tag terms hide the groups they empty and open the groups they keep, and they
  compose with the All/Changes filter.
- **Tag picker** — a tag-icon control at the trailing edge of the search
  field, muted like the leading `⌕` glyph and filling to a soft rounded square
  on hover. It opens a panel anchored under the field and aligned to its width
  (max-width 440px): a `--chrome-surface` card with a hairline border, 10px
  radius, and `--chrome-shadow` elevation, holding an uppercase 11px muted
  `Tags` head above a wrapping row of the details inspector's tag chips. The
  panel lists every tag the catalogue declares, in alphabetical order, and
  scrolls internally once that set outgrows it. Selecting a chip enters
  `tag:<tag>` in the search field, replacing any tag term already entered, and
  closes the panel; selecting the chip whose tag is the entered term clears that
  term. The chip matching the entered query carries the accent active state with
  contrast text and glyph. A tag chip is a button on both surfaces: it reports
  whether its tag is entered through `aria-pressed`, fills with the soft accent
  on hover, and moves down 1px with an inset shadow while pressed. Opening the
  panel moves focus to the chip for the entered tag, or to the first chip when
  no tag is entered; the chip row then keeps a single tab stop that ArrowLeft
  and ArrowRight rove and wrap at both ends, Home and End send to its ends, and
  Enter or Space activates. That chip row is a labelled toolbar carrying the
  single tab stop, while the details inspector's chips stay independent tab
  stops. Escape closes the panel and returns focus to the control without
  changing the query, and a click outside closes it, returning focus to the
  control only when the closing panel still holds it. A catalogue that declares
  no tags renders neither the control nor the panel.
- **Navigation** — 248px initial column, `#fbfbfa` background, hairline right
  border. On desktop, an 8px-wide split separator with a centred 2×32px grip
  resizes the column from 192px to 480px without exceeding half the viewport.
  Dragging resizes continuously; Left/Right change it by 16px, Home/End choose
  its bounds, and double-click restores 248px. Served pages remember the last
  chosen width. The separator is absent from the mobile drawer and without
  JavaScript. The head row is `CATALOGUE` (uppercase, 11px) with a text button
  labelled `Collapse all`; an All/Changes segmented filter (with a monospace
  changed count) appears when Git change detection is available, followed by
  the scrollable tree. The drawer below the breakpoint shows the same body.
  - Groups are native `<details>` whose summary row shows a closed/open folder
    SVG pair (swapped via the `[open]` state), a bold label, and a monospace
    child count. Leaves show a screen, page, or flow SVG; flow icons read in
    the accent.
  - Rows indent 16px per depth from an 8px root inset and paint one faint
    1px vertical guide per ancestor depth. The hover/active highlight is an
    inset pill starting at the row's indent (`--mbk-indent`), so guides stay
    visible; the active row uses the accent with contrast text.
  - Catalogue-link navigation opens every collection on the active
    row's path and scrolls that row into view. Search and Changes filtering may
    stay selected only while the active row remains visible. Reapplying an
    active filter during navigation preserves collapsed groups outside the
    destination path, while editing the search or filter opens groups to reveal
    current matches. Clearing filtering restores earlier disclosures except
    for a destination path opened by navigation.
- **Screen head** — surface band with the breadcrumb trail (11.5px, `›`
  separators; ancestor crumbs that resolve to a viewable route are links) and
  a title row: 19px heading plus a monospace ID button labelled `#<id>`. The
  button uses the standard pointer cursor, moves down 1px with an inset shadow
  while pressed, and copies the unprefixed ID without navigating.
  Screen routes place the right-aligned Mobile/Desktop/Both segmented viewport
  control in this band.
- **Stage** — dotted-grid background (22px radial dots), centred frames with
  40px gap, internal `overflow: auto`, `MOBILE` / `DESKTOP` uppercase frame
  labels, and no separate toolbar above the grid.
- **Details inspector** — collapsible `<details>` bottom panel, open by default
  until the user changes it, after which Browse retains that disclosure across
  routes and reloads: a bar with a rotating chevron, `Details`, and a muted
  hint; a two-column body (`1.35fr / 1fr`) with description and
  `Why this screen —` rationale on the left and uppercase-labelled metadata
  rows (Source, Generated, Schemes, Tags, Related docs, Dependencies, Used by)
  on the right. Paths render as monospace chips; use cases render as pill chips
  with the flow icon; the Schemes row is plain text naming the schemes the
  screen renders in (`light, dark`). The Tags row lists the tags the entry
  declares as pill chips with the tag icon: selecting one enters `tag:<tag>` in
  the search field, so the filter stays visible and clearable there, and the
  chip whose tag is in the entered query carries the accent active state with
  contrast text and glyph. An entry that declares no tags omits the row.

## Device Chrome

- **Phone frame** — 390×844, 12px bezel padding, `#171a18` body,
  46px radius, floating notch (108×30 at top 22px), a 36px-radius screen that
  is white unless the dark scheme is selected, and a bottom home pill (128×4).
  The screen is a column: a reserved status band followed by the embedded
  mobile fragment, which takes the remaining height and rounds only its bottom
  corners.
- **Phone status band** — the top 44px of the screen, padded `14px 28px 0` so
  its content clears the notch: a `9:41` clock on the left and cellular, Wi-Fi,
  and battery glyphs on the right. Text is 13.5px/600 in the screen ink
  (`--chrome-ink`, or `--mbk-dark-screen-ink` when the screen is dark) with
  tabular numerals; glyphs are 16×11 except the 22×11 battery, drawn with
  `currentColor` on their own viewBoxes. The band is device chrome, so it
  reserves space above the fragment rather than covering screen content.
- **Browser frame** — width 100%, max-width 1180px, height 760px, strong
  hairline border, 8px radius. Its 40px bar holds three traffic lights
  (`#d9655b`, `#dba43d`, `#50a86d`), a monospace address pill (copies the
  address on click, showing a `URL copied` toast), and the expand toggle.
- **Expand toggle** — a 26px bordered button (`⤢` / `⤡`). Expanding fixes the
  frame to `inset: 2.5vh 2.5vw` at overlay z-index over a scrim
  (`rgba(20, 28, 22, 0.55)`), locks body scroll, and swaps the glyph; Escape
  or clicking outside collapses it. Only one frame expands at a time.
- **Use-case flow** — vertical numbered steps (32px accent number tiles)
  joined by a 2px connector line, each with title, description, a
  `This screen in the catalogue: <title> →` link, and one browser frame
  (height 640px) indented under the step head.
- **Legacy embed** — a bordered, 12px-radius iframe pane on the dotted stage.

## Color Scheme

A catalogue may render dark fragments beside its light ones. The selection
changes only what a device screen shows; every shell surface around the frames
keeps the light chrome palette in both schemes.

| Token                   | Value     | Role                             |
| ----------------------- | --------- | -------------------------------- |
| `--mbk-dark-screen-bg`  | `#121514` | Dark device-screen surface       |
| `--mbk-dark-screen-ink` | `#eef1ef` | Text and glyphs on a dark screen |

There is no third dark token: the secondary dark tones (status-band ink, home
pill, screen hairline, and the depicted screen content) are `color-mix` blends
of those two.

- **Containment** — dark paints the phone screen surface, including its
  status-band ink, its home pill, and the fragment it holds, and the browser
  viewport surface. The phone body and notch, the browser bar with its traffic
  lights and address pill, and every shell surface outside a device screen stay
  light.
- **Screen edge** — a dark screen inside the near-black phone body would lose
  its edge, so the phone screen carries a 1px inset `box-shadow` hairline mixed
  from the two dark tokens, painted on an overlay above the fragment so the
  embedded document cannot occlude it:
  `color-mix(in srgb, var(--mbk-dark-screen-ink) 12%, var(--mbk-dark-screen-bg))`.
  The browser viewport needs none; its light bar already draws that edge.
- **Control** — a `Light | Dark` `mbk-seg`, shown only when the catalogue has
  dark fragments. At or above the breakpoint it sits in the top bar between the
  search field and the end of the bar; below it the top bar has no room, so it
  renders in the screen head band under the viewport control at full width.
- **Light-only screens** — a screen with no dark render keeps its light frames
  under a dark selection and states the fallback in its frame label, which
  gains an `mbk-frame-scheme-note` span so the caption reads
  `MOBILE — LIGHT ONLY` or `DESKTOP — LIGHT ONLY`. The note is the
  lighter-weight tail of the same uppercase label, not a separate badge.
  A use-case step frame carries the same fallback state but has no label, so it
  shows no scheme caption.
- **Diff views** — keep the normal viewport and color-scheme controls in the
  screen heading and top bar. The compact diff band changes only how the
  selected screen is displayed. Light-only comparisons name their fallback;
  dark styling remains contained within device screens.

## Responsive Behavior

The shell has one breakpoint at **56.25rem (900px)**:

- At or above it, the navigation column is persistent and the layout is the
  fixed two-column split above.
- Below it, the navigation becomes a scrimmed overlay drawer (82% width, max
  20rem) opened by the top-bar menu button throughout the catalogue. The
  drawer opens under the 48px bar and the bar stacks above the scrim, so the
  menu button that opened it, the brand and the query stay
  at full strength while only the shell below the bar dims. The tag picker
  stops anchoring to the narrow field and drops as a sheet spanning the shell,
  flush under the bar's bottom border with only its lower corners rounded. The
  phone frame scales via `aspect-ratio: 390 / 844` within available width, the
  browser frame drops to 560px height, flow connector lines hide, the details
  body stacks to one column, and the color-scheme control moves from the top
  bar into the screen head band. When a screen head cannot fit its title and
  the controls on one row, they wrap beneath the title and span the available
  width, stacking the scheme control under the viewport control.

`prefers-reduced-motion: reduce` disables shell transitions.

## In-place Comparisons

The catalogue remains the only shell. A screen has a compact Current / Side by
side / Overlay / Difference band below its heading. Current is the initial
state in both All and Changes. Diff selections load snapshots on demand in the
same main region; controls, navigation, and details stay in place. Refresh and
retry controls are available after an explicit comparison request. Static
catalogues without a comparison server omit the band.

Both viewports reuse the existing device-frame components. Before and current
snapshots remain in script-disabled iframes. Overlay composites the current
pane at 50% opacity; Difference uses CSS difference blending. Missing panes
remain side by side for readability in every mode. No pixel percentages are
shown. Baseline, affected files, and excluded content belong in secondary
comparison details. Loading and failure states keep the catalogue available.

The canonical Current and Overlay designs live at
`design/review/controls/current.html` and `design/review/controls/overlay.html`;
their mobile and desktop components share the catalogue shell. Existing design
routes keep their identifiers, while outcome and impact screens depict Changes.
See [the complete behavior](./mokabook-changes.md).

## Related Docs

- [Build and Browse runtime](./mokabook-runtime.md)
- [Package and authoring contract](./mokabook-package.md)
