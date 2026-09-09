import type { ReactNode } from "react";

import { CompareToolbar } from "./compare.js";
import { DesignLink, DesignNavigation } from "./design_navigation.js";
import { DESTINATIONS, type DesignDestination } from "./destinations.js";
import { TopBar } from "./top_bar.js";
import { SelectionControl } from "./selection_control.js";

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
  menuIcon?: ReactNode;
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
  menuIcon,
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
            menuIcon={menuIcon}
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
          menuIcon={menuIcon}
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

interface CrumbsProps {
  items: readonly string[];
}

/** Ancestor collection trail above a routed catalogue view. */
export function Crumbs({ items }: CrumbsProps) {
  return (
    <nav className="mbk-crumbs" aria-label="Catalogue location">
      <DesignLink to={DESTINATIONS.home}>
        <span>Catalogue home</span>
      </DesignLink>
      <span className="sep">›</span>
      {items.map((item, index) => (
        <span key={item}>
          {index > 0 ? <span className="sep">›</span> : null}
          {item}
        </span>
      ))}
    </nav>
  );
}

interface ScreenHeadProps {
  accessibleControls?: boolean;
  action?: ReactNode;
  crumbs: readonly string[];
  idChip?: string;
  comparisonMode?: "current" | "difference" | "overlay" | "side-by-side";
  comparisons?: boolean;
  status?: ReactNode;
  title: string;
}

/** The white head band: breadcrumbs, title, id chip, and status. */
export function ScreenHead({
  accessibleControls,
  action,
  crumbs,
  idChip,
  comparisonMode,
  comparisons = true,
  status,
  title,
}: ScreenHeadProps) {
  return (
    <>
      <div className="mbk-screen-head">
        <div>
          <Crumbs items={crumbs} />
          <div className="mbk-title-row">
            <h2>{title}</h2>
            {idChip ? (
              <span aria-label={`ID ${idChip}`} className="mbk-idchip">
                #{idChip}
              </span>
            ) : null}
            {status}
          </div>
        </div>
        {action}
      </div>
      {idChip && comparisons ? (
        <CompareToolbar
          mode={comparisonMode ?? "current"}
          accessible={accessibleControls}
        />
      ) : null}
    </>
  );
}

interface ViewSwitchProps {
  accessible?: boolean;
  active: "both" | "desktop" | "mobile";
}

/** Viewport selection control shown in a selected screen header. */
export function ViewSwitch({ active, accessible = false }: ViewSwitchProps) {
  const options: readonly { key: ViewSwitchProps["active"]; label: string }[] =
    [
      { key: "mobile", label: "Mobile" },
      { key: "desktop", label: "Desktop" },
      { key: "both", label: "Both" },
    ];
  return (
    <span className="mbk-seg" role="group" aria-label="Viewport">
      {options.map((option) => (
        <SelectionControl
          key={option.key}
          active={option.key === active}
          accessible={accessible}
          label={option.label}
        />
      ))}
    </span>
  );
}
