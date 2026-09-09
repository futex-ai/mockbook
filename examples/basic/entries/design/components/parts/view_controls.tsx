import { useId } from "react";

import type { ArtboardViewport } from "../../parts/shell.js";
import { ViewIcon } from "./view_icons.js";

export interface HighlightOption {
  active: boolean;
  unavailable: "empty" | "unavailable" | "comparison" | undefined;
}

const highlightReasons = {
  empty: "No registered components in this view",
  unavailable: "Component inspection is unavailable",
  comparison: "Highlighting is unavailable in comparisons",
} as const;

/** Native form state controls the authored previews without consumer scripts. */
export function ViewControls({
  viewport,
  highlight,
}: {
  viewport: ArtboardViewport;
  highlight?: HighlightOption;
}) {
  const reasonId = useId();
  const reason = highlight?.unavailable
    ? highlightReasons[highlight.unavailable]
    : undefined;
  return (
    <div
      className="ce-view-controls"
      role="toolbar"
      aria-label="Preview options"
    >
      <label
        className="ce-icon-control ce-viewport-control"
        title="Preview viewport"
      >
        <ViewIcon kind="mobile" />
        <ViewIcon kind="desktop" />
        <ViewIcon kind="both" />
        <span className="ce-dropdown-arrow" aria-hidden="true">
          ⌄
        </span>
        <select
          className="ce-viewport-select"
          aria-label="Preview viewport"
          defaultValue={viewport}
        >
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
          <option value="both">Both</option>
        </select>
      </label>
      <label
        className="ce-icon-control ce-theme-control"
        title="Toggle light/dark mode"
      >
        <input
          type="checkbox"
          role="switch"
          className="ce-theme-toggle"
          aria-label="Dark mode"
        />
        <ViewIcon kind="light" />
        <ViewIcon kind="dark" />
      </label>
      {highlight ? (
        <label
          className="ce-icon-control ce-highlight-control"
          title={reason ?? "Highlight components"}
        >
          <input
            type="checkbox"
            role="switch"
            className="ce-highlight-toggle"
            aria-label="Highlight components"
            aria-describedby={reason ? reasonId : undefined}
            defaultChecked={highlight.active}
            disabled={reason !== undefined}
          />
          <ViewIcon kind="highlight" />
          {reason ? (
            <span id={reasonId} className="ce-control-description">
              {reason}
            </span>
          ) : null}
        </label>
      ) : null}
    </div>
  );
}

export function PreviewScheme() {
  return (
    <>
      <span className="ce-scheme-light">Light</span>
      <span className="ce-scheme-dark">Dark</span>
    </>
  );
}
