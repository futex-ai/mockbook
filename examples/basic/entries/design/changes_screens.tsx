import { screen } from "mokabook";

import { ComparisonStage } from "./parts/compare.js";
import { DetailsPanel } from "./parts/details.js";
import { NavTree } from "./parts/nav.js";
import { ScreenHead, Shell, ViewSwitch } from "./parts/shell.js";
import { BrowserFrame, MiniWelcome, PhoneFrame, Stage } from "./parts/stage.js";

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
      viewport={viewport}
      nav={<NavTree activeLabel="Welcome" changedOnly />}
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
      <DetailsPanel />
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
