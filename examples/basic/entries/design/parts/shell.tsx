import type { ReactNode } from "react";

import { screenHeader } from "../library/chrome/screen-header.js";
import { viewControls } from "../library/controls/view-controls.js";
import { optional, useDesignInstance } from "../library/composition.js";
import type { ChangeStatus } from "../components/parts/comparison_fixtures.js";
import { DesignNavigation, useDesignNavigation } from "./design_navigation.js";
import { DESTINATIONS, type DesignDestination } from "./destinations.js";
import { TopBar } from "./top_bar.js";

/** Rendering target for a design mockup artboard. */
export type ArtboardViewport = "desktop" | "mobile";

/** Color scheme depicted as selected for the fragments on the stage. */
export type ShellColorScheme = "dark" | "light";

interface ShellProps {
  design: DesignDestination;
  accessibleControls?: boolean | undefined;
  searchPlaceholder?: string | undefined;
  activeTag?: string | undefined;
  aside?: ReactNode;
  children: ReactNode;
  colorScheme?: ShellColorScheme | undefined;
  menuPresentation?: "text" | "icon" | undefined;
  nav: ReactNode;
  searchValue?: string | undefined;
  tagPickerOpen?: boolean | undefined;
  viewport: ArtboardViewport;
}

/** The Mokabook shell scaffold for one design mockup. */
export function Shell({
  accessibleControls,
  activeTag,
  aside,
  children,
  design,
  colorScheme,
  menuPresentation,
  nav,
  searchValue,
  searchPlaceholder,
  tagPickerOpen,
  viewport,
}: ShellProps) {
  if (viewport === "desktop") {
    return (
      <DesignNavigation design={design}>
        <div className="mbk-shell mbk-shell--desktop">
          <TopBar
            menuPresentation={menuPresentation}
            accessibleControls={accessibleControls}
            searchPlaceholder={searchPlaceholder}
            drawerOpen={design === DESTINATIONS.navigation}
            activeTag={activeTag}
            colorScheme={colorScheme}
            searchValue={searchValue}
            tagPickerOpen={tagPickerOpen}
            viewport={viewport}
          />
          <div className="mbk-body">
            {nav}
            <main className="mbk-main">{children}</main>
          </div>
        </div>
      </DesignNavigation>
    );
  }
  return (
    <DesignNavigation design={design}>
      <div className="mbk-shell mbk-shell--mobile">
        <TopBar
          menuPresentation={menuPresentation}
          accessibleControls={accessibleControls}
          searchPlaceholder={searchPlaceholder}
          drawerOpen={design === DESTINATIONS.navigation}
          activeTag={activeTag}
          colorScheme={colorScheme}
          searchValue={searchValue}
          tagPickerOpen={tagPickerOpen}
          viewport={viewport}
        />
        <main className="mbk-main">{children}</main>
        {aside}
      </div>
    </DesignNavigation>
  );
}

interface ScreenHeadProps {
  accessibleControls?: boolean;
  action?: ReactNode;
  crumbs: readonly string[];
  idChip?: string;
  comparisonMode?: "current" | "difference" | "overlay" | "side-by-side";
  comparisons?: boolean;
  status?: ChangeStatus;
  title: string;
}

/** The white head band: breadcrumbs, title, id chip, and status. */
export function ScreenHead({
  accessibleControls,
  action,
  crumbs,
  idChip,
  comparisonMode,
  comparisons = false,
  status,
  title,
}: ScreenHeadProps) {
  const navigation = useDesignNavigation();
  return (
    <screenHeader.Component
      mokabookInstance={useDesignInstance("header")}
      title={title}
      crumbs={[
        {
          key: "home",
          label: "Catalogue home",
          destination: DESTINATIONS.home,
        },
        ...crumbs.map((item) => ({ key: item, label: item })),
      ]}
      comparisons={comparisons}
      mode={comparisonMode ?? "current"}
      accessible={accessibleControls ?? false}
      destinations={navigation.comparison ?? {}}
      {...optional("idChip", idChip)}
      {...optional("status", status)}
      actions={action}
    />
  );
}

interface ViewSwitchProps {
  accessible?: boolean;
  active: "both" | "desktop" | "mobile";
}

/** Viewport selection control shown in a selected screen header. */
export function ViewSwitch({ active, accessible = false }: ViewSwitchProps) {
  return (
    <viewControls.Component
      mokabookInstance={useDesignInstance("viewport")}
      selection={active}
      scheme="light"
      presentation="viewport-segments"
      accessible={accessible}
      destinations={{}}
    />
  );
}
