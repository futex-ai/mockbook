# Basic Example Notes

These screens are synthetic fixtures for exercising Mokabook. They are not
application product designs.

## Design Catalogue Notes

Navigation adoption is planned in the
[design mockup links contract](../../docs/protocol/mokabook-design-links.md).
The notes below describe the current static artboards until that work ships.

The `Design` navigation group holds the approved mockups for Mokabook's own
catalogue shell and Changes controls. Implementation notes for those mockups live here and
in each entry's description and rationale, never inside the rendered screens:

- The depicted catalogue content is this example's own Welcome, Details, and
  Example tour entries, so no product data appears in any shell design.
- The `Farewell` screen shown in comparison mockups is sample comparison data that
  deliberately has no standalone entry: it depicts a screen that was removed
  on a branch.
- Links inside the design screens are drawn as styled text because the mockups
  are static pictures of the shell; real navigation behavior is specified in
  the runtime protocol.
- Desktop Current and comparison views share one visible navigation split grip.
  The static mockups record its resting state; pointer, keyboard, bounds, and
  persistence behavior are specified in the runtime protocol.
- Catalogue-link navigation reuses the approved active-row, disclosure, and
  frame visuals. The implementation adds behavior and inert generated metadata
  only, so this change requires no new Design catalogue screen or pixel state.
- The dark-scheme, light-only, and dark view compare screens are light
  documents that draw a shell with dark selected, so they opt out of dark
  generation like every other design screen. Only the depicted device screens
  change; the shell chrome around them stays light in both schemes.
- The dark view compare screen shows the same `Welcome` comparison as the
  changed screen, in its dark view. The normal scheme control changes the
  comparison in place, while the catalogue shell remains light.
- The `forms` and `onboarding` tags are synthetic fixture labels that carry no
  product meaning: the Welcome entry declares both and the Details entry
  declares `forms` in their authored metadata, which is why the `tag:forms`
  tree keeps both screen rows.
- Tag chips and the search field's tag control are drawn as styled text like
  every other link inside a design screen, carrying the same hover and pressed
  styling as the shell's chips so the affordance stays part of the recorded
  design. The chip in the accent state depicts the tag named by the search
  query; opening the picker, moving across its chips with the keyboard, and
  selecting one to enter that query are runtime behavior.
- The tag control is drawn in every search field the artboards show, because it
  belongs to the field whenever the catalogue declares tags and this fixture
  always does. Only the tag-filter artboards draw its panel open, because only
  they depict a reader choosing a tag; the panel lists the same `forms` and
  `onboarding` fixture labels, which are the whole set of tags this catalogue
  declares.
- The tag-filter artboards draw the top-bar search field because the entered
  query is the depicted state. The narrow one draws it too: the shell keeps the
  search field in the top bar below the breakpoint, and the artboard reduces the
  brand to its mark so the field has room, which is how the served narrow Browse
  bar renders. All narrow artboards now retain the same search field.
- The narrow tag-filter artboard draws no navigation drawer: one overlay at a
  time keeps the depicted state readable, and the open picker is the state this
  screen records. The tree the query filters is left to the wide artboard,
  which has the room to show it beside the panel.
- The narrow navigation drawer opens under the top bar, and the bar stays above
  the drawer's scrim: the menu button that opened it, the brand, and the query
  beside them keep their full-strength surface while only the shell below the
  bar dims. The served shell stacks its bar above the scrim the same way, so
  the artboard and the shipped drawer agree.
- The `Light | Dark` control sits in the top bar on the wide artboards and in
  the screen head band, under the viewport control, on the narrow ones: a 390px
  top bar has no room for a third control.
- The comparison band contains Current, Side by side, Overlay, and Difference.
  Viewport and scheme selections remain in the normal screen header and top bar.
  Every screen starts in Current, and diff snapshots load only after a click.
  The same band belongs to the actual shell in both development and published
  catalogues; it is independent of the design pictures rendered inside frames.
- The approved tokens, consumer-tunable accent properties, and responsive
  breakpoints are recorded in `docs/protocol/mokabook-shell-design.md`.

## Intentional Implementation Differences

The shipped shell was visually smoke-tested against these mockups. The
following presentation differences are intentional:

- The details inspector's collapsed bar shows one fixed hint
  ("Description, rationale, source, related docs, and use cases") rather than
  the state-specific hint copy some mockups draw.
- Navigation groups render in deterministic alphabetical order, so the
  `Design` group precedes `Example` when this example is served.
- The Browse changed/all filter appears only when the serve base ref resolves
  in Git; the mockups always show it with a sample count.
- The mockups draw a small-phone artboard variant so a full 390×844 phone fits
  the depicted narrow shells; the served shell always uses the full-size
  phone frame and scales it below the responsive breakpoint.
- The served tag chips and tag control are buttons that announce their state —
  a pressed chip for the entered tag, an expanded control for the open panel —
  and the panel is hidden until it is opened. A screen is a picture, so the
  artboards draw the chosen chip and the open panel directly and leave those
  semantics to the runtime protocol.
- There is no separate Review section or standalone comparison command. Stable
  design routes retain their old identifiers to preserve catalogue links.
- Difference mockups use CSS blending, as does the served comparison; no pixel
  percentages or invented diff metrics appear. Classification and impact facts
  come from the comparison engine in the runtime and from synthetic fixture data
  in these design references.
