import { screen } from "mokabook";

import { CompareGrid, ComparisonStage, Pane } from "./parts/compare.js";
import { DESTINATIONS } from "./parts/destinations.js";
import { DetailsPanel } from "./parts/details.js";
import { MiniWelcome } from "./parts/mini_screens.js";
import { NavDrawer } from "./parts/nav.js";
import {
  EmptyReviewNav,
  IgnoredImpactCard,
  ReviewNav,
  SharedImpactCard,
} from "./parts/review.js";
import { ScreenHead, Shell, ViewSwitch } from "./parts/shell.js";
import { BrowserFrame, PhoneFrame, Stage } from "./parts/stage.js";

type ReviewViewport = "desktop" | "mobile";

function WelcomeShot({
  viewport,
  comparison = true,
}: {
  viewport: ReviewViewport;
  comparison?: boolean;
}) {
  return viewport === "desktop" ? (
    <BrowserFrame address="example.test/welcome" expandable={!comparison}>
      <MiniWelcome />
    </BrowserFrame>
  ) : (
    <PhoneFrame small>
      <MiniWelcome compact />
    </PhoneFrame>
  );
}

function SharedImpactSummary({ viewport }: { viewport: ReviewViewport }) {
  return (
    <Shell
      design={DESTINATIONS.shared}
      viewport={viewport}
      nav={<ReviewNav activeTitle="Welcome" />}
    >
      <ScreenHead
        crumbs={["Example", "Screens"]}
        idChip="example-welcome"
        title="Welcome"
        comparisonMode="side-by-side"
        action={<ViewSwitch active={viewport} />}
      />
      <ComparisonStage
        state="unchanged"
        viewport={viewport}
        evidence={<SharedImpactCard />}
      >
        <CompareGrid>
          <Pane label="Before" side="before">
            <WelcomeShot viewport={viewport} />
          </Pane>
          <Pane label="Current" side="after">
            <WelcomeShot viewport={viewport} />
          </Pane>
        </CompareGrid>
      </ComparisonStage>
      <DetailsPanel subject="welcome" />
    </Shell>
  );
}

function IgnoredOnlyCompare({ viewport }: { viewport: ReviewViewport }) {
  return (
    <Shell
      design={DESTINATIONS.ignored}
      viewport={viewport}
      nav={<ReviewNav activeTitle="Welcome" />}
    >
      <ScreenHead
        action={<ViewSwitch active={viewport} />}
        comparisonMode="side-by-side"
        crumbs={["Example", "Screens"]}
        idChip="example-welcome"
        title="Welcome"
      />
      <ComparisonStage
        state="ignored-only"
        viewport={viewport}
        evidence={<IgnoredImpactCard />}
      >
        <CompareGrid>
          <Pane label="Before" side="before">
            <WelcomeShot viewport={viewport} />
          </Pane>
          <Pane label="Current" side="after">
            <WelcomeShot viewport={viewport} />
          </Pane>
        </CompareGrid>
      </ComparisonStage>
      <DetailsPanel subject="welcome" />
    </Shell>
  );
}

function EmptyChanges({ viewport }: { viewport: ReviewViewport }) {
  return (
    <Shell
      design={DESTINATIONS.empty}
      viewport={viewport}
      nav={<EmptyReviewNav />}
      aside={
        viewport === "mobile" ? (
          <NavDrawer changedOnly changedCount={0} nodes={[]} />
        ) : null
      }
    >
      <ScreenHead
        action={<ViewSwitch active={viewport} />}
        crumbs={["Example", "Screens"]}
        idChip="example-welcome"
        title="Welcome"
      />
      <Stage>
        <WelcomeShot viewport={viewport} comparison={false} />
      </Stage>
      <DetailsPanel subject="welcome" />
    </Shell>
  );
}

/** Design screens for secondary comparison evidence and an empty Changes filter. */
export const reviewImpactScreens = [
  screen({
    colorSchemes: ["light"],
    description:
      "A screen comparison with secondary evidence from changed shared inputs.",
    desktop: <SharedImpactSummary viewport="desktop" />,
    id: "design-review-shared-impact",
    mobile: <SharedImpactSummary viewport="mobile" />,
    slug: "shared-impact",
    title: "Shared impact",
  }),
  screen({
    colorSchemes: ["light"],
    description: "A screen whose only differences fall inside ignored regions.",
    desktop: <IgnoredOnlyCompare viewport="desktop" />,
    id: "design-review-ignored-only",
    mobile: <IgnoredOnlyCompare viewport="mobile" />,
    slug: "ignored-only",
    title: "Ignored only",
  }),
  screen({
    colorSchemes: ["light"],
    description:
      "Changes has no matching screens; the selected Current view remains available.",
    desktop: <EmptyChanges viewport="desktop" />,
    id: "design-review-empty",
    mobile: <EmptyChanges viewport="mobile" />,
    slug: "empty",
    title: "No changes",
  }),
];
