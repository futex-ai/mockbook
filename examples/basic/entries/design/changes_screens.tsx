import { screen } from "mokabook";

import { ComparisonStage } from "./parts/compare.js";
import { DESTINATIONS } from "./parts/destinations.js";
import { DetailsPanel } from "./parts/details.js";
import { MiniWelcome } from "./parts/mini_screens.js";
import { ReviewNav } from "./parts/review.js";
import { ScreenHead, Shell, ViewSwitch } from "./parts/shell.js";
import { BrowserFrame, PhoneFrame, Stage } from "./parts/stage.js";

function ChangesScreen({
  overlay,
  viewport,
}: {
  overlay: boolean;
  viewport: "mobile" | "desktop";
}) {
  const content = (
    <div style={{ position: "relative", isolation: "isolate" }}>
      <MiniWelcome compact={viewport === "mobile"} />
      {overlay ? (
        <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
          <MiniWelcome compact={viewport === "mobile"} revised />
        </div>
      ) : null}
    </div>
  );
  const framed =
    viewport === "mobile" ? (
      <PhoneFrame small>{content}</PhoneFrame>
    ) : (
      <BrowserFrame address="example.test/welcome" expandable={!overlay}>
        {content}
      </BrowserFrame>
    );
  return (
    <Shell
      design={overlay ? DESTINATIONS.overlay : DESTINATIONS.current}
      viewport={viewport}
      nav={<ReviewNav activeTitle="Welcome" />}
    >
      <ScreenHead
        comparisonMode={overlay ? "overlay" : "current"}
        action={<ViewSwitch active={viewport} />}
        crumbs={["Example", "Screens"]}
        idChip="example-welcome"
        title="Welcome"
      />
      {overlay ? (
        <ComparisonStage state="changed" viewport={viewport}>
          {framed}
        </ComparisonStage>
      ) : (
        <Stage>{framed}</Stage>
      )}
      <DetailsPanel subject="welcome" />
    </Shell>
  );
}

/** On-demand comparison controls share the normal catalogue screen. */
export const changesScreens = [
  screen({
    colorSchemes: ["light"],
    description:
      "Changes opens a screen in Current; comparison starts only after selecting a diff option.",
    desktop: <ChangesScreen overlay={false} viewport="desktop" />,
    id: "design-changes-current",
    mobile: <ChangesScreen overlay={false} viewport="mobile" />,
    slug: "current",
    title: "Current screen in Changes",
  }),
  screen({
    colorSchemes: ["light"],
    description:
      "Overlay compares the selected screen in place, with the same controls also available from All.",
    desktop: <ChangesScreen overlay viewport="desktop" />,
    id: "design-changes-overlay",
    mobile: <ChangesScreen overlay viewport="mobile" />,
    slug: "overlay",
    title: "On-demand overlay",
  }),
];
