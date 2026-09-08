import type { ReactNode } from "react";

import { CompareToolbar } from "./compare.js";
import { SearchTagButton, TagPicker } from "./tag_filter.js";

/** Rendering target for a design mockup artboard. */
export type ArtboardViewport = "desktop" | "mobile";

/** Color scheme depicted as selected for the fragments on the stage. */
export type ShellColorScheme = "dark" | "light";

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
}

function Brand({ markOnly }: { markOnly: boolean }) {
  return (
    <span className="mbk-brand">
      <span className="mbk-mark" aria-hidden="true">
        ◫
      </span>
      {markOnly ? null : "Mokabook"}
    </span>
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
      <span aria-hidden="true">⌕</span>
      {value === undefined ? (
        "Search screens…"
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
  const options: readonly { key: ShellColorScheme; label: string }[] = [
    { key: "light", label: "Light" },
    { key: "dark", label: "Dark" },
  ];
  return (
    <span className="mbk-seg" role="group" aria-label="Color scheme">
      {options.map((option) => (
        <span
          key={option.key}
          className={option.key === active ? "active" : undefined}
        >
          {option.label}
        </span>
      ))}
    </span>
  );
}

/** The 48px shell header: brand mark, search, and color scheme. */
export function TopBar({
  activeTag,
  colorScheme,
  searchValue,
  tagPickerOpen,
  viewport,
}: TopBarProps) {
  return (
    <header className="mbk-topbar">
      {viewport === "mobile" ? (
        <button
          className="mbk-menu-btn"
          type="button"
          aria-label="Open catalogue navigation"
        >
          ☰
        </button>
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

interface ShellProps {
  activeTag?: string | undefined;
  aside?: ReactNode;
  children: ReactNode;
  colorScheme?: ShellColorScheme | undefined;
  nav: ReactNode;
  searchValue?: string | undefined;
  tagPickerOpen?: boolean | undefined;
  viewport: ArtboardViewport;
}

/** The Mokabook shell scaffold for one design mockup. */
export function Shell({
  activeTag,
  aside,
  children,
  colorScheme,
  nav,
  searchValue,
  tagPickerOpen,
  viewport,
}: ShellProps) {
  if (viewport === "desktop") {
    return (
      <div className="mbk-shell mbk-shell--desktop">
        <TopBar
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
    );
  }
  return (
    <div className="mbk-shell mbk-shell--mobile">
      <TopBar
        activeTag={activeTag}
        colorScheme={colorScheme}
        searchValue={searchValue}
        tagPickerOpen={tagPickerOpen}
        viewport={viewport}
      />
      <main className="mbk-main">{children}</main>
      {aside}
    </div>
  );
}

interface CrumbsProps {
  items: readonly string[];
}

/** Ancestor collection trail above a routed catalogue view. */
export function Crumbs({ items }: CrumbsProps) {
  return (
    <nav className="mbk-crumbs" aria-label="Catalogue location">
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
              <button
                aria-label={`Copy ID ${idChip}`}
                className="mbk-idchip"
                type="button"
              >
                #{idChip}
              </button>
            ) : null}
            {status}
          </div>
        </div>
        {action}
      </div>
      {idChip && comparisons ? (
        <CompareToolbar mode={comparisonMode ?? "current"} />
      ) : null}
    </>
  );
}

interface ViewSwitchProps {
  active: "both" | "desktop" | "mobile";
}

/** Viewport selection control shown in a selected screen header. */
export function ViewSwitch({ active }: ViewSwitchProps) {
  const options: readonly { key: ViewSwitchProps["active"]; label: string }[] =
    [
      { key: "mobile", label: "Mobile" },
      { key: "desktop", label: "Desktop" },
      { key: "both", label: "Both" },
    ];
  return (
    <span className="mbk-seg" role="group" aria-label="Viewport">
      {options.map((option) => (
        <span
          key={option.key}
          className={option.key === active ? "active" : undefined}
        >
          {option.label}
        </span>
      ))}
    </span>
  );
}
