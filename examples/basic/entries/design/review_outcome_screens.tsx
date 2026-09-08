import type { ReactNode } from "react";

import { screen } from "mokabook";

import { DetailsPanel } from "./parts/details.js";
import {
  CompareGrid,
  MissingPane,
  Pane,
  ComparisonStage,
} from "./parts/compare.js";
import { ReviewNav, type ReviewState } from "./parts/review.js";
import {
  ScreenHead,
  SchemeSwitch,
  Shell,
  ViewSwitch,
  type ShellColorScheme,
} from "./parts/shell.js";
import {
  BrowserFrame,
  MiniDetails,
  MiniFarewell,
  MiniWelcome,
  PhoneFrame,
} from "./parts/stage.js";

type CompareViewport = "desktop" | "mobile";

interface ComparePageProps {
  activeTitle: string;
  children: ReactNode;
  colorScheme?: ShellColorScheme | undefined;
  idChip: string;
  mode?: "difference" | "overlay" | "side-by-side";
  state: ReviewState;
  title: string;
  viewport: CompareViewport;
}

function ComparePage({
  activeTitle,
  children,
  colorScheme,
  idChip,
  mode,
  state,
  title,
  viewport,
}: ComparePageProps) {
  return (
    <Shell
      viewport={viewport}
      colorScheme={colorScheme}
      nav={
        viewport === "desktop" ? <ReviewNav activeTitle={activeTitle} /> : null
      }
    >
      <ScreenHead
        action={
          <>
            <ViewSwitch active={viewport} />
            {colorScheme && viewport === "mobile" ? (
              <SchemeSwitch active={colorScheme} />
            ) : null}
          </>
        }
        comparisonMode={mode ?? "side-by-side"}
        crumbs={["Example", "Screens"]}
        idChip={idChip}
        title={title}
      />
      <ComparisonStage state={state} viewport={viewport}>
        {children}
      </ComparisonStage>
      <DetailsPanel />
    </Shell>
  );
}

function FramedShot({
  address,
  children,
  dark,
  viewport,
}: {
  address: string;
  children: ReactNode;
  dark?: boolean;
  viewport: CompareViewport;
}) {
  if (viewport === "desktop") {
    return (
      <BrowserFrame address={address} dark={dark} expandable={false}>
        {children}
      </BrowserFrame>
    );
  }
  return (
    <PhoneFrame dark={dark} small>
      {children}
    </PhoneFrame>
  );
}

function ChangedCompare({ viewport }: { viewport: CompareViewport }) {
  const compact = viewport === "mobile";
  return (
    <ComparePage
      activeTitle="Welcome"
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
      activeTitle="Details"
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
      activeTitle="Farewell"
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
      activeTitle="Welcome"
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
      activeTitle="Welcome"
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
