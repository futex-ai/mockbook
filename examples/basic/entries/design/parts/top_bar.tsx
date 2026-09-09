import { DesignLink, useDesignNavigation } from "./design_navigation.js";
import { DESTINATIONS } from "./destinations.js";
import { BrandIcon, SearchIcon } from "./icons.js";
import type { ArtboardViewport, ShellColorScheme } from "./shell.js";
import { SearchTagButton, TagPicker } from "./tag_filter.js";

interface TopBarProps {
  /** Tag the entered query names, drawn as the accent chip in the picker. */
  activeTag?: string | undefined;
  /**
   * Selected color scheme. Wide artboards show it as a top-bar switch; narrow
   * artboards leave the switch to the screen head band, which has the room.
   */
  colorScheme?: ShellColorScheme | undefined;
  /** Text entered in the search field, visible in both artboard sizes. */
  searchValue?: string | undefined;
  /** Whether the tag picker is drawn open under the search field. */
  tagPickerOpen?: boolean | undefined;
  viewport: ArtboardViewport;
  drawerOpen?: boolean;
}

function Brand({ markOnly }: { markOnly: boolean }) {
  return (
    <DesignLink to={DESTINATIONS.home}>
      <span className="mbk-brand" aria-label="Mokabook">
        <span className="mbk-mark" aria-hidden="true">
          <BrandIcon />
        </span>
        {markOnly ? null : "Mokabook"}
      </span>
    </DesignLink>
  );
}

interface SearchFieldProps {
  activeTag?: string | undefined;
  pickerOpen?: boolean | undefined;
  value?: string | undefined;
}

function SearchField({ activeTag, pickerOpen, value }: SearchFieldProps) {
  return (
    <div className="mbk-search">
      <SearchIcon />
      {value === undefined ? (
        "Search catalogue…"
      ) : (
        <span className="mbk-search-value">{value}</span>
      )}
      <SearchTagButton />
      {pickerOpen === true ? <TagPicker activeTag={activeTag} /> : null}
    </div>
  );
}

/** Color scheme selection shown once a catalogue has dark fragments. */
export function SchemeSwitch({ active }: { active: ShellColorScheme }) {
  const navigation = useDesignNavigation();
  const options: readonly { key: ShellColorScheme; label: string }[] = [
    { key: "light", label: "Light" },
    { key: "dark", label: "Dark" },
  ];
  return (
    <span className="mbk-seg" role="group" aria-label="Color scheme">
      {options.map((option) => (
        <DesignLink
          key={option.key}
          to={
            option.key === active
              ? undefined
              : navigation.schemeLinks?.[option.key]
          }
        >
          <span className={option.key === active ? "active" : undefined}>
            {option.label}
          </span>
        </DesignLink>
      ))}
    </span>
  );
}

/** The 48px shell header: brand mark, search, and color scheme. */
export function TopBar({
  activeTag,
  colorScheme,
  drawerOpen,
  searchValue,
  tagPickerOpen,
  viewport,
}: TopBarProps) {
  const navigation = useDesignNavigation();
  const open = navigation.drawer?.open ?? drawerOpen;
  return (
    <header className="mbk-topbar">
      {viewport === "mobile" ? (
        <DesignLink
          to={
            navigation.drawer?.to ??
            (open ? DESTINATIONS.home : DESTINATIONS.navigation)
          }
        >
          <span
            className="mbk-menu-btn"
            aria-label={
              open ? "Close catalogue navigation" : "Open catalogue navigation"
            }
          >
            {open ? "×" : "☰"}
          </span>
        </DesignLink>
      ) : null}
      <Brand markOnly={viewport === "mobile"} />
      <SearchField
        activeTag={activeTag}
        pickerOpen={tagPickerOpen}
        value={searchValue}
      />
      {colorScheme !== undefined && viewport === "desktop" ? (
        <SchemeSwitch active={colorScheme} />
      ) : null}
    </header>
  );
}
