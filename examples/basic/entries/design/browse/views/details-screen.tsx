import { screen } from "mokabook";

import { DESTINATIONS } from "../../parts/destinations.js";
import { DetailsPanel } from "../../parts/details.js";
import { MiniDetails } from "../../parts/mini_screens.js";
import { NavTree } from "../../parts/nav.js";
import { ScreenHead, Shell, ViewSwitch } from "../../parts/shell.js";
import { BrowserFrame, PhoneFrame, Stage } from "../../parts/stage.js";
import { SchemeSwitch } from "../../parts/top_bar.js";

function DetailsHead({ mobile = false }: { mobile?: boolean }) {
  return (
    <ScreenHead
      action={
        <>
          <ViewSwitch active={mobile ? "mobile" : "both"} />
          {mobile ? <SchemeSwitch active="light" /> : null}
        </>
      }
      crumbs={["Example", "Screens"]}
      idChip="example-details"
      title="Details"
    />
  );
}

/** Normal light Details, with both framed fragments and a closed inspector. */
export function DetailsScreenDesktop() {
  return (
    <Shell
      design={DESTINATIONS.details}
      colorScheme="light"
      viewport="desktop"
      nav={<NavTree activeLabel="Details" />}
    >
      <DetailsHead />
      <Stage>
        <PhoneFrame label="Mobile">
          <MiniDetails compact />
        </PhoneFrame>
        <BrowserFrame address="example.test/details" label="Desktop">
          <MiniDetails />
        </BrowserFrame>
      </Stage>
      <DetailsPanel subject="details" />
    </Shell>
  );
}

/** Narrow counterpart of the normal light Details destination. */
export function DetailsScreenMobile() {
  return (
    <Shell
      design={DESTINATIONS.details}
      colorScheme="light"
      viewport="mobile"
      nav={null}
    >
      <DetailsHead mobile />
      <Stage>
        <PhoneFrame label="Mobile" small>
          <MiniDetails compact />
        </PhoneFrame>
      </Stage>
      <DetailsPanel subject="details" />
    </Shell>
  );
}

export const detailsScreen = screen({
  colorSchemes: ["light"],
  description:
    "The normal Details screen with light selected and its inspector closed.",
  desktop: <DetailsScreenDesktop />,
  id: "design-browse-details-screen",
  mobile: <DetailsScreenMobile />,
  slug: "details-screen",
  title: "Details screen",
});
