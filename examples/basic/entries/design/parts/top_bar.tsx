import { topBar } from "../library/chrome/top-bar.js";
import { viewControls } from "../library/controls/view-controls.js";
import { optional, useDesignInstance } from "../library/composition.js";
import { useDesignNavigation } from "./design_navigation.js";
import { DESTINATIONS } from "./destinations.js";
import { tagPickerTarget } from "./navigation_states.js";
import type { ArtboardViewport, ShellColorScheme } from "./shell.js";
import { designTagRecords } from "./tag_filter.js";

interface TopBarProps {
  menuPresentation?: "text" | "icon" | undefined;
  accessibleControls?: boolean | undefined;
  searchPlaceholder?: string | undefined;
  activeTag?: string | undefined;
  colorScheme?: ShellColorScheme | undefined;
  searchValue?: string | undefined;
  tagPickerOpen?: boolean | undefined;
  viewport: ArtboardViewport;
  drawerOpen?: boolean;
}

/** Map this screen's navigation and query into recorded top-bar inputs. */
export function TopBar({
  accessibleControls,
  activeTag,
  colorScheme,
  drawerOpen,
  menuPresentation,
  searchValue,
  searchPlaceholder,
  tagPickerOpen,
  viewport,
}: TopBarProps) {
  const navigation = useDesignNavigation();
  return (
    <topBar.Component
      mokabookInstance={useDesignInstance("top-bar")}
      viewport={viewport}
      placeholder={searchPlaceholder ?? "Search screens…"}
      menu={drawerOpen ? "close" : "open"}
      menuPresentation={menuPresentation ?? "text"}
      accessible={accessibleControls ?? false}
      tags={designTagRecords(navigation.tags)}
      pickerOpen={tagPickerOpen ?? false}
      brandDestination={DESTINATIONS.home}
      menuDestination={drawerOpen ? DESTINATIONS.home : DESTINATIONS.navigation}
      schemeDestinations={navigation.schemeLinks ?? {}}
      {...optional("query", searchValue)}
      {...optional("scheme", colorScheme)}
      {...optional("activeTag", activeTag)}
      {...optional("pickerDestination", tagPickerTarget(navigation.tags))}
    />
  );
}

/** Preserve the legacy scheme control's distinct placement and destinations. */
export function SchemeSwitch({
  active,
  accessible,
}: {
  active: ShellColorScheme;
  accessible?: boolean | undefined;
}) {
  const navigation = useDesignNavigation();
  return (
    <viewControls.Component
      mokabookInstance={useDesignInstance("scheme")}
      selection="desktop"
      scheme={active}
      presentation="scheme-segments"
      accessible={accessible ?? false}
      destinations={navigation.schemeLinks ?? {}}
    />
  );
}
