import { screen } from "mokabook";

import { WelcomeHead } from "./browse_screens.js";
import { DetailsPanel } from "./parts/details.js";
import { NavTree, type NavNode } from "./parts/nav.js";
import { Shell } from "./parts/shell.js";
import { BrowserFrame, MiniWelcome, PhoneFrame, Stage } from "./parts/stage.js";

/** The tag the depicted selection entered as a search term. */
const ACTIVE_TAG = "forms";

/** The query that selection left in the search field. */
const TAG_QUERY = `tag:${ACTIVE_TAG}`;

/**
 * Rows the query keeps: entries without the tag and the groups they empty drop
 * out, and the groups that keep a row stay open.
 */
const TAGGED_TREE: readonly NavNode[] = [
  { count: 3, depth: 0, kind: "collection", label: "Example", open: true },
  { count: 2, depth: 1, kind: "collection", label: "Screens", open: true },
  { depth: 2, kind: "screen", label: "Welcome" },
  { depth: 2, kind: "screen", label: "Details" },
];

function TagFilterDesktop() {
  return (
    <Shell
      activeTag={ACTIVE_TAG}
      viewport="desktop"
      nav={<NavTree activeLabel="Welcome" nodes={TAGGED_TREE} />}
      searchValue={TAG_QUERY}
      tagPickerOpen
    >
      <WelcomeHead active="desktop" />
      <Stage>
        <BrowserFrame address="example.test/welcome" label="Desktop">
          <MiniWelcome />
        </BrowserFrame>
      </Stage>
      <DetailsPanel activeTag={ACTIVE_TAG} open />
    </Shell>
  );
}

function TagFilterMobile() {
  return (
    <Shell
      activeTag={ACTIVE_TAG}
      viewport="mobile"
      nav={null}
      searchValue={TAG_QUERY}
      tagPickerOpen
    >
      <WelcomeHead active="mobile" />
      <Stage>
        <PhoneFrame label="Mobile" small>
          <MiniWelcome compact />
        </PhoneFrame>
      </Stage>
    </Shell>
  );
}

/** Browse shell design screen for tag filtering through the search field. */
export const browseTagScreens = [
  screen({
    colorSchemes: ["light"],
    description:
      "The search field's tag picker open over the catalogue it has filtered.",
    desktop: <TagFilterDesktop />,
    id: "design-browse-tag-filter",
    mobile: <TagFilterMobile />,
    rationale:
      "Tags are a secondary way to narrow a catalogue, so they get no permanent room in the navigation: the picker hangs off the search field, opened by the tag control at the field's trailing edge, and its panel scrolls, which keeps a catalogue with many tags as workable as one with two. Selecting a chip writes that tag into the field as a search term, so the active filter stays visible and clearable where a reader already looks for one, and it still composes with free text and the All/Changed filter; selecting the chip for the entered term clears it again. Rows without the tag and the groups they leave empty drop out of the tree, and every chip for the entered term reads in the accent, so the picker, the inspector chips, the query, and the filtered tree describe a single state.",
    slug: "tag-filter",
    title: "Tag filter",
  }),
];
