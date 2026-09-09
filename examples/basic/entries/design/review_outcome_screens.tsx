import { screen } from "mokabook";

import { CompareGrid, MissingPane, Pane } from "./parts/compare.js";
import {
  ComparePage,
  FramedShot,
  type CompareViewport,
} from "./parts/compare_page.js";
import { DESTINATIONS } from "./parts/destinations.js";
import {
  MiniDetails,
  MiniFarewell,
  MiniWelcome,
} from "./parts/mini_screens.js";

function ChangedCompare({ viewport }: { viewport: CompareViewport }) {
  const compact = viewport === "mobile";
  return (
    <ComparePage
      design={DESTINATIONS.changed}
      colorScheme="light"
      activeTitle="Welcome"
      subject="welcome"
      idChip="example-welcome"
      state="changed"
      title="Welcome"
      viewport={viewport}
    >
      <CompareGrid>
        <Pane label="Before" side="before">
          <FramedShot address="example.test/welcome" viewport={viewport}>
            <MiniWelcome compact={compact} />
          </FramedShot>
        </Pane>
        <Pane label="Current" side="after">
          <FramedShot address="example.test/welcome" viewport={viewport}>
            <MiniWelcome compact={compact} revised />
          </FramedShot>
        </Pane>
      </CompareGrid>
    </ComparePage>
  );
}

function AddedCompare({ viewport }: { viewport: CompareViewport }) {
  const compact = viewport === "mobile";
  return (
    <ComparePage
      design={DESTINATIONS.added}
      activeTitle="Details"
      subject="details"
      idChip="example-details"
      state="added"
      title="Details"
      viewport={viewport}
    >
      <CompareGrid>
        <MissingPane
          label="Before"
          message="This screen was added on this branch."
          side="before"
        />
        <Pane label="Current" side="after">
          <FramedShot address="example.test/details" viewport={viewport}>
            <MiniDetails compact={compact} />
          </FramedShot>
        </Pane>
      </CompareGrid>
    </ComparePage>
  );
}

function RemovedCompare({ viewport }: { viewport: CompareViewport }) {
  const compact = viewport === "mobile";
  return (
    <ComparePage
      design={DESTINATIONS.removed}
      activeTitle="Farewell"
      subject="farewell"
      idChip="example-farewell"
      state="removed"
      title="Farewell"
      viewport={viewport}
    >
      <CompareGrid>
        <Pane label="Before" side="before">
          <FramedShot address="example.test/farewell" viewport={viewport}>
            <MiniFarewell compact={compact} />
          </FramedShot>
        </Pane>
        <MissingPane
          label="Current"
          message="This screen was removed on this branch."
          side="after"
        />
      </CompareGrid>
    </ComparePage>
  );
}

function DifferenceCompare({ viewport }: { viewport: CompareViewport }) {
  const compact = viewport === "mobile";
  return (
    <ComparePage
      design={DESTINATIONS.difference}
      activeTitle="Welcome"
      subject="welcome"
      idChip="example-welcome"
      mode="difference"
      state="changed"
      title="Welcome"
      viewport={viewport}
    >
      <CompareGrid difference>
        <Pane label="Before" side="before">
          <FramedShot address="example.test/welcome" viewport={viewport}>
            <MiniWelcome compact={compact} />
          </FramedShot>
        </Pane>
        <Pane label="Current" side="after">
          <FramedShot address="example.test/welcome" viewport={viewport}>
            <MiniWelcome compact={compact} revised />
          </FramedShot>
        </Pane>
      </CompareGrid>
    </ComparePage>
  );
}

function DarkViewCompare({ viewport }: { viewport: CompareViewport }) {
  const compact = viewport === "mobile";
  return (
    <ComparePage
      design={DESTINATIONS.darkChanged}
      activeTitle="Welcome"
      subject="welcome"
      colorScheme="dark"
      idChip="example-welcome"
      state="changed"
      title="Welcome"
      viewport={viewport}
    >
      <CompareGrid>
        <Pane label="Before" side="before">
          <FramedShot address="example.test/welcome" dark viewport={viewport}>
            <MiniWelcome compact={compact} />
          </FramedShot>
        </Pane>
        <Pane label="Current" side="after">
          <FramedShot address="example.test/welcome" dark viewport={viewport}>
            <MiniWelcome compact={compact} revised />
          </FramedShot>
        </Pane>
      </CompareGrid>
    </ComparePage>
  );
}

/** Review design screens for per-screen comparison outcomes. */
export const reviewOutcomeScreens = [
  screen({
    colorSchemes: ["light"],
    description: "A changed screen compared side by side with its base render.",
    desktop: <ChangedCompare viewport="desktop" />,
    id: "design-review-changed",
    mobile: <ChangedCompare viewport="mobile" />,
    slug: "changed",
    title: "Changed screen",
  }),
  screen({
    colorSchemes: ["light"],
    description: "An added screen with no base render to compare against.",
    desktop: <AddedCompare viewport="desktop" />,
    id: "design-review-added",
    mobile: <AddedCompare viewport="mobile" />,
    slug: "added",
    title: "Added screen",
  }),
  screen({
    colorSchemes: ["light"],
    description: "A removed screen keeping only its base render.",
    desktop: <RemovedCompare viewport="desktop" />,
    id: "design-review-removed",
    mobile: <RemovedCompare viewport="mobile" />,
    slug: "removed",
    title: "Removed screen",
  }),
  screen({
    colorSchemes: ["light"],
    description: "Difference mode blends the two screen versions in place.",
    desktop: <DifferenceCompare viewport="desktop" />,
    id: "design-review-difference",
    mobile: <DifferenceCompare viewport="mobile" />,
    slug: "difference",
    title: "Difference mode",
  }),
  screen({
    colorSchemes: ["light"],
    description:
      "The dark view of a changed screen compared side by side with its base render.",
    desktop: <DarkViewCompare viewport="desktop" />,
    id: "design-review-dark-scheme",
    mobile: <DarkViewCompare viewport="mobile" />,
    rationale:
      "A screen with a dark render uses the normal Light | Dark and viewport controls while the compact diff band selects its display mode. Dark reaches only inside the compared device screens (--mbk-dark-screen-bg #121514, --mbk-dark-screen-ink #eef1ef); the changed-screens navigation, head band, and the segments themselves stay light. A screen that renders in light only shows no scheme segment, and the head band never repeats the selected scheme in its title.",
    slug: "dark-scheme",
    title: "Dark view compare",
  }),
];
