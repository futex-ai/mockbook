import { MockLink } from "mokabook";

import { ViewSwitch, type ArtboardViewport } from "../../parts/shell.js";
import { SchemeSwitch } from "../../parts/top_bar.js";
import { COMPONENT_PAGES } from "./destinations.js";
import type { ComponentPageState } from "./component_details.js";

export function ViewControls({ viewport }: { viewport: ArtboardViewport }) {
  return (
    <div className="ce-view-controls">
      <ViewSwitch active={viewport} accessible />
      {viewport === "mobile" ? (
        <SchemeSwitch active="light" accessible />
      ) : null}
    </div>
  );
}

/** Saved variants are links between canonical mockup states, with one selected. */
export function VariantPicker({ state }: { state: ComponentPageState }) {
  const disabled = state === "disabled";
  const removed = state === "removed";
  const defaultId =
    state === "toolbar"
      ? "design-component-toolbar"
      : state === "hidden"
        ? "design-component-help"
        : state === "unused"
          ? "design-component-unused"
          : "design-component-overview";
  return (
    <nav className="ce-variants" aria-label="Saved variants">
      <span>Variant</span>
      <MockLink
        to={!disabled && !removed ? COMPONENT_PAGES[state] : defaultId}
        aria-current={!disabled && !removed ? "page" : undefined}
      >
        Default
      </MockLink>
      {defaultId === "design-component-overview" ? (
        <MockLink
          to="design-component-variants"
          aria-current={disabled ? "page" : undefined}
        >
          Disabled
        </MockLink>
      ) : null}
      {removed ? (
        <MockLink to="design-component-removed" aria-current="page">
          Compact · Removed
        </MockLink>
      ) : null}
    </nav>
  );
}

export function HighlightToggle({
  active = false,
  unavailable = false,
}: {
  active?: boolean;
  unavailable?: boolean;
}) {
  return (
    <button
      className="ce-button ce-highlight-toggle"
      type="button"
      aria-pressed={active}
      disabled={unavailable}
    >
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
      >
        <path d="M5 1H1v4m10-4h4v4M1 11v4h4m10-4v4h-4" />
        <rect x="5" y="5" width="6" height="6" rx="1" />
      </svg>
      Highlight components
    </button>
  );
}
