import { screen } from "mokabook";

import { useCaseScreen } from "./browse/views/use-case.js";
import { DesignNavigation } from "./parts/design_navigation.js";
import { DESTINATIONS } from "./parts/destinations.js";
import { DetailsPanel } from "./parts/details.js";
import { MiniWelcome } from "./parts/mini_screens.js";
import { NavDrawer, NavTree } from "./parts/nav.js";
import { WelcomeHead } from "./parts/screen_heads.js";
import { Shell } from "./parts/shell.js";
import { BrowserFrame, PhoneFrame, Stage } from "./parts/stage.js";
import { EmptyState } from "./parts/stage_content.js";
import { TopBar } from "./parts/top_bar.js";

function HomeBody() {
  return (
    <EmptyState
      to={DESTINATIONS.welcome}
      title="Mokabook"
      body="Browse the mockup catalogue generated from this repository."
      linkLabel="Open the first screen"
    />
  );
}

function HomeDesktop() {
  return (
    <Shell design={DESTINATIONS.home} viewport="desktop" nav={<NavTree />}>
      <HomeBody />
    </Shell>
  );
}

function HomeMobile() {
  return (
    <Shell design={DESTINATIONS.home} viewport="mobile" nav={null}>
      <HomeBody />
    </Shell>
  );
}

function SelectedScreenDesktop() {
  return (
    <Shell
      design={DESTINATIONS.welcome}
      colorScheme="light"
      viewport="desktop"
      nav={<NavTree activeLabel="Welcome" />}
    >
      <WelcomeHead active="both" />
      <Stage>
        <PhoneFrame label="Mobile">
          <MiniWelcome compact />
        </PhoneFrame>
        <BrowserFrame address="example.test/welcome" label="Desktop">
          <MiniWelcome />
        </BrowserFrame>
      </Stage>
      <DetailsPanel subject="welcome" />
    </Shell>
  );
}

function SelectedScreenMobile() {
  return (
    <Shell
      design={DESTINATIONS.welcome}
      colorScheme="light"
      viewport="mobile"
      nav={null}
    >
      <WelcomeHead active="mobile" scheme="light" />
      <Stage>
        <PhoneFrame label="Mobile" small>
          <MiniWelcome compact />
        </PhoneFrame>
      </Stage>
      <DetailsPanel subject="welcome" />
    </Shell>
  );
}

function DetailsOpenDesktop() {
  return (
    <Shell
      design={DESTINATIONS.inspector}
      viewport="desktop"
      nav={<NavTree activeLabel="Welcome" />}
    >
      <WelcomeHead active="desktop" />
      <Stage>
        <BrowserFrame address="example.test/welcome" label="Desktop">
          <MiniWelcome />
        </BrowserFrame>
      </Stage>
      <DetailsPanel subject="welcome" open />
    </Shell>
  );
}

function DetailsOpenMobile() {
  return (
    <Shell design={DESTINATIONS.inspector} viewport="mobile" nav={null}>
      <WelcomeHead active="mobile" />
      <DetailsPanel subject="welcome" open />
    </Shell>
  );
}

function MissingRouteBody() {
  return (
    <EmptyState
      to={DESTINATIONS.home}
      title="Screen not found"
      body="Nothing in the catalogue matches"
      code="view/screens/unknown.html"
      linkLabel="Go to the catalogue home"
    />
  );
}

function MissingRouteDesktop() {
  return (
    <Shell design={DESTINATIONS.missing} viewport="desktop" nav={<NavTree />}>
      <MissingRouteBody />
    </Shell>
  );
}

function MissingRouteMobile() {
  return (
    <Shell design={DESTINATIONS.missing} viewport="mobile" nav={null}>
      <MissingRouteBody />
    </Shell>
  );
}

function NarrowNavigationDesktop() {
  return (
    <DesignNavigation design={DESTINATIONS.navigation}>
      <div className="mbk-shell mbk-shell--collapsed">
        <TopBar viewport="mobile" drawerOpen />
        <main className="mbk-main">
          <HomeBody />
        </main>
        <NavDrawer activeLabel="Welcome" />
      </div>
    </DesignNavigation>
  );
}

function NarrowNavigationMobile() {
  return (
    <Shell
      design={DESTINATIONS.navigation}
      viewport="mobile"
      nav={null}
      aside={<NavDrawer activeLabel="Welcome" />}
    >
      <HomeBody />
    </Shell>
  );
}

/** Browse shell design screens grouped by catalogue views and shell states. */
export const browseViewScreens = [
  screen({
    colorSchemes: ["light"],
    description:
      "The catalogue home with the navigation tree, search, and filter.",
    desktop: <HomeDesktop />,
    id: "design-browse-home",
    mobile: <HomeMobile />,
    slug: "home",
    title: "Home",
  }),
  screen({
    colorSchemes: ["light"],
    description:
      "A selected screen with viewport switching and framed fragments.",
    desktop: <SelectedScreenDesktop />,
    id: "design-browse-screen",
    mobile: <SelectedScreenMobile />,
    slug: "screen",
    title: "Selected screen",
  }),
  useCaseScreen,
];

/** Browse shell design screens for secondary shell states. */
export const browseStateScreens = [
  screen({
    colorSchemes: ["light"],
    description: "The details panel expanded under a selected screen.",
    desktop: <DetailsOpenDesktop />,
    id: "design-browse-details",
    mobile: <DetailsOpenMobile />,
    slug: "details",
    title: "Details panel",
  }),
  screen({
    colorSchemes: ["light"],
    description: "The not-found view keeping catalogue navigation available.",
    desktop: <MissingRouteDesktop />,
    id: "design-browse-missing-route",
    mobile: <MissingRouteMobile />,
    slug: "missing-route",
    title: "Missing route",
  }),
  screen({
    colorSchemes: ["light"],
    description:
      "Collapsed navigation opening as a drawer on narrow viewports.",
    desktop: <NarrowNavigationDesktop />,
    id: "design-browse-navigation",
    mobile: <NarrowNavigationMobile />,
    slug: "navigation",
    title: "Narrow navigation",
  }),
];
